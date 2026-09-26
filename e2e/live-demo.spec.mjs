#!/usr/bin/env node
// BRIAN live two-user demo, end to end: a patient (phone-sized) and a doctor (desktop) in two
// browser contexts against one running server + web build. See README.md for how to run it.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  DEMO,
  ManagedServer,
  api,
  apiLogin,
  bodyText,
  clickTab,
  config,
  isUp,
  sleep,
  tabBadge,
  waitFor,
  waitForNoText,
  waitForText,
  waitForUrl,
} from './helpers.mjs';

const RUN = Date.now().toString(36).slice(-5);
const results = [];
const consoleErrors = [];
let patient; // { ctx, page }
let doctor;
let server = null;
let cleanup = { allergies: null };

// ───────────────────────── tiny runner ─────────────────────────

const color = (code) => (s) => (process.stdout.isTTY && !process.env.NO_COLOR ? `\u001b[${code}m${s}\u001b[0m` : s);
const green = color('32');
const red = color('31');
const dim = color('2');

async function shot(page, name) {
  if (!page || page.isClosed()) return;
  await page.screenshot({ path: path.join(config.shots, `${name}.png`) }).catch(() => {});
}

async function step(id, title, fn) {
  const num = String(id).replace(/[a-z]$/, '');
  if (config.only.length && !config.only.includes(num) && !config.only.includes(String(id))) {
    results.push({ id, title, status: 'skip' });
    console.log(dim(`  - ${id}. ${title} (skipped)`));
    return;
  }
  const t0 = Date.now();
  try {
    const note = await fn();
    const ms = Date.now() - t0;
    if (note && typeof note === 'object' && note.skip) {
      results.push({ id, title, status: 'skip', ms, reason: note.skip });
      console.log(dim(`  - ${id}. ${title} (skipped: ${note.skip})`));
      return;
    }
    results.push({ id, title, status: 'pass', ms });
    console.log(`  ${green('✓')} ${id}. ${title} ${dim(`(${(ms / 1000).toFixed(1)} s)`)}${note ? dim(` — ${note}`) : ''}`);
  } catch (err) {
    const ms = Date.now() - t0;
    results.push({ id, title, status: 'fail', ms, error: err.message });
    console.log(`  ${red('✗')} ${id}. ${title}\n      ${red(err.message.split('\n').slice(0, 4).join('\n      '))}`);
    await shot(patient?.page, `FAIL-${id}-patient`);
    await shot(doctor?.page, `FAIL-${id}-doctor`);
  }
}

// ───────────────────────── page helpers ─────────────────────────

async function newRoleContext(browser, role, name) {
  const mobile = role !== 'doctor';
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
  });
  if (config.pinServerUrl) {
    await ctx.addInitScript((url) => {
      try {
        window.localStorage.setItem('brian.serverUrl', url);
      } catch {}
    }, config.api);
  }
  const page = await ctx.newPage();
  page.setDefaultTimeout(config.timeout);
  page.on('console', (m) => {
    if (m.type() === 'error' && !/ERR_CONNECTION_REFUSED|WebSocket connection/.test(m.text())) {
      consoleErrors.push(`[${name}] ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => consoleErrors.push(`[${name}] pageerror: ${e.message}`));
  return { ctx, page };
}

async function go(page, route, timeout = config.timeout) {
  await page.goto(config.web + route, { timeout: Math.max(timeout, 30_000) });
}

/**
 * Inactive tab screens stay mounted (and "visible") under the active one on web, so a plain
 * locator can resolve to a covered element. Click the first match that is actually on top.
 */
async function clickOnTop(locator, message) {
  await waitFor(async () => {
    const n = await locator.count();
    for (let i = 0; i < n; i++) {
      const el = locator.nth(i);
      const state = await el
        .evaluate((node) => {
          const r = node.getBoundingClientRect();
          if (!r.width || !r.height) return 'hidden';
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          if (y < 0 || y > window.innerHeight || x < 0 || x > window.innerWidth) return 'offscreen';
          const top = document.elementFromPoint(x, y);
          return top && (node === top || node.contains(top)) ? 'top' : 'covered';
        })
        .catch(() => 'hidden');
      if (state === 'offscreen' || state === 'covered') {
        // Partly hidden under the tab bar / a header, or below the fold: bring it to the middle.
        await el.evaluate((node) => node.scrollIntoView({ block: 'center' })).catch(() => {});
      }
      if (state === 'top') {
        await el.click({ timeout: 5000 });
        return true;
      }
    }
    return false;
  }, message ?? `clickable ${locator}`);
}

async function dismissToasts(page) {
  const close = page.getByRole('button', { name: 'Dismiss notification' });
  for (let i = (await close.count()) - 1; i >= 0; i--) await close.nth(i).click({ timeout: 2000 }).catch(() => {});
}

const labelOf = (locator) => locator.first().getAttribute('aria-label');

async function toastWith(page, needle, message) {
  return waitFor(
    async () => (await page.locator(`[aria-label*="${needle.replace(/"/g, '\\"')}"][aria-live]`).count()) > 0,
    message ?? `toast containing "${needle}"`,
  );
}

async function openMayaChart() {
  const d = doctor.page;
  if (/\/doctor\/patients\/usr_/.test(d.url())) return;
  await clickTab(d, 'Patients');
  await clickOnTop(d.getByRole('button', { name: /^Maya Johnson, \d+ years/ }), "Maya's card on the patient list");
  await waitForUrl(d, /\/doctor\/patients\/[^/?]+$/);
  await waitForText(d, 'Prescriptions');
}

async function openPatientChat() {
  const p = patient.page;
  await clickTab(p, 'Care');
  await sleep(300);
  if (/\/patient\/care\/chat/.test(p.url())) return;
  if (!/\/patient\/care$/.test(p.url())) {
    await clickTab(p, 'Care'); // tapping the focused tab pops its stack
    await sleep(300);
    if (!/\/patient\/care(\/chat)?$/.test(p.url())) await go(p, '/patient/care');
    if (/\/patient\/care\/chat/.test(p.url())) return;
  }
  await clickOnTop(p.getByRole('button', { name: /^Message Dr\./ }), '"Message Dr. …" on Care');
  await waitForUrl(p, /\/patient\/care\/chat/);
}

async function openDoctorThread() {
  const d = doctor.page;
  await clickTab(d, 'Messages');
  await sleep(300);
  if (/\/doctor\/messages\/[^/]+__/.test(d.url())) return;
  await clickOnTop(d.getByRole('button', { name: /^Maya Johnson, (online|offline)/ }), "Maya's thread");
  await waitForUrl(d, /\/doctor\/messages\/[^/]+__/);
}

async function send(page, body) {
  const box = page.getByLabel('Message', { exact: true });
  await clickOnTop(box, 'chat composer');
  await box.pressSequentially(body, { delay: 8 });
  await box.press('Enter');
}

/** Accessible label of the chat bubble with `body` ("You, 5:24 AM: body. Seen 5:24 AM"), or null. */
async function bubbleLabel(page, body) {
  const labels = await page
    .locator(`[aria-label*="${body}"]`)
    .evaluateAll((els) => els.map((e) => e.getAttribute('aria-label') ?? ''));
  return labels.find((l) => /^.+?, \d{1,2}:\d{2}\s?[AP]M: /.test(l)) ?? null;
}

/** Number of answers with a source list currently rendered in the AI chat. */
const aiAnswers = (page) => page.locator('[role="list"][aria-label$="for this answer"]').count();

/** Wait until the AI chat shows more sourced answers than `before` and is idle again. */
async function waitForAiAnswer(page, before) {
  await waitFor(async () => (await aiAnswers(page)) > before, 'a new BRIAN answer with sources', { timeout: 60_000 });
  await waitFor(async () => (await page.getByLabel('Waiting for the answer').count()) === 0, 'BRIAN AI to be idle', {
    timeout: 60_000,
  });
}

// ───────────────────────── steps ─────────────────────────

async function setup() {
  fs.mkdirSync(config.shots, { recursive: true });
  if (config.manageServer) {
    server = new ManagedServer();
    await server.start();
    console.log(dim(`  started a private server on ${config.api} (data: ${server.dataFile})`));
  }
  if (!(await isUp(`${config.api}/api/health`, 5000))) {
    throw new Error(`BRIAN server is not answering at ${config.api}/api/health — start it (npm run server) or set BRIAN_API_URL / E2E_MANAGE_SERVER=1.`);
  }
  if (!(await isUp(config.web, 30_000))) {
    throw new Error(`BRIAN web app is not answering at ${config.web} — run "npm run dev:web" or serve a web export, or set BRIAN_WEB_URL.`);
  }
  const doctorToken = await apiLogin(DEMO.doctor.email);
  if (config.reset) {
    await api('POST', '/api/admin/reset', { token: doctorToken });
    console.log(dim('  demo data reset (E2E_RESET=1)'));
  }
  const patientToken = await apiLogin(DEMO.patient.email);
  // Leftovers from an interrupted earlier run.
  const { prescriptions } = await api('GET', '/api/prescriptions', { token: patientToken });
  for (const rx of prescriptions) {
    if (rx.status !== 'discontinued' && /\[e2e/.test(rx.instructions ?? '')) {
      await api('DELETE', `/api/prescriptions/${rx.id}`, { token: doctorToken }).catch(() => {});
    }
  }
  const metformin = prescriptions.find((rx) => rx.drugName === 'Metformin' && rx.status === 'active');
  if (!metformin) throw new Error('Seed data missing: Maya has no active Metformin prescription (run with E2E_RESET=1).');
  const { refillRequests } = await api('GET', '/api/refills?status=pending', { token: patientToken });
  for (const r of refillRequests.filter((r) => r.prescriptionId === metformin.id)) {
    await api('PATCH', `/api/refills/${r.id}`, { token: doctorToken, body: { status: 'denied', doctorNote: 'e2e cleanup' } });
  }
  const { user } = await api('GET', '/api/me', { token: patientToken });
  cleanup.allergies = user.patient?.allergies ?? [];
}

async function main() {
  console.log(`\nBRIAN live demo e2e · run ${RUN}\n  web ${config.web}\n  api ${config.api}\n  shots ${config.shots}\n`);
  try {
    await setup();
  } catch (err) {
    console.error(red(`Setup failed: ${err.message}`));
    await server?.stop().catch(() => {});
    process.exit(2);
  }

  const browser = await chromium.launch({ headless: !config.headed, slowMo: config.slowMo });
  patient = await newRoleContext(browser, 'patient', 'patient');
  doctor = await newRoleContext(browser, 'doctor', 'doctor');
  const p = patient.page;
  const d = doctor.page;

  // 1 ── Welcome → login (LGTM) → role home
  await step('1a', 'Patient: welcome → Get started → Demo patient → LGTM → Home', async () => {
    await go(p, '/', config.firstLoadTimeout);
    await waitForText(p, 'Get started', 'welcome screen', { timeout: config.firstLoadTimeout });
    await shot(p, '01-welcome');
    await p.getByText('Get started', { exact: true }).click();
    await waitForUrl(p, /\/login/);
    await p.getByLabel(/^Demo patient/).click();
    await waitForText(p, 'LGTM', 'LGTM confirmation', { interval: 50 });
    await shot(p, '01-patient-lgtm');
    await waitForUrl(p, /\/patient$/);
    await waitForText(p, /Today[’']s doses/, 'patient home');
    await shot(p, '01-patient-home');
  });

  await step('1b', 'Doctor: /login?role=doctor → Demo doctor → LGTM → Patients', async () => {
    await go(d, '/login?role=doctor', config.firstLoadTimeout);
    await d.getByLabel(/^Demo doctor/).click({ timeout: config.firstLoadTimeout });
    await waitForText(d, 'LGTM', 'LGTM confirmation', { interval: 50 });
    await waitForUrl(d, /\/doctor$/);
    await waitForText(d, /Patients? online/, 'doctor home');
    await shot(d, '01-doctor-home');
  });

  await step('1c', 'Sign up a brand-new patient and a brand-new doctor', async () => {
    const who = [
      { role: 'patient', email: `e2e.patient.${RUN}@example.com`, name: `Nia Run${RUN}`, home: /\/patient$/, greet: 'Nia' },
      { role: 'doctor', email: `e2e.doctor.${RUN}@example.com`, name: `Dr. Sam Run${RUN}`, home: /\/doctor$/, greet: `Dr. Run${RUN}` },
    ];
    for (const w of who) {
      const x = await newRoleContext(browser, w.role, `new-${w.role}`);
      try {
        await go(x.page, '/login');
        if (w.role === 'doctor') await x.page.getByRole('radio', { name: "I'm a doctor" }).click();
        await x.page.getByLabel('Email').fill(w.email);
        await x.page.getByLabel('Password', { exact: true }).fill('any');
        await x.page.getByLabel(/Your name/).fill(w.name);
        await x.page.getByRole('button', { name: /Continue/ }).click();
        await waitForText(x.page, 'Account created', `${w.role} sign-up confirmation`, { interval: 50 });
        await waitForUrl(x.page, w.home);
        await waitForText(x.page, w.greet, `${w.role} greeting "${w.greet}"`);
        await shot(x.page, `01-new-${w.role}-home`);
      } finally {
        await x.ctx.close();
      }
    }
    // New patients are assigned to the demo doctor — Dr. Reyes' list picks it up live.
    await waitForText(d, `Nia Run${RUN}`, 'new patient on the doctor list (live, no refresh)');
  });

  // 2 ── Presence
  await step('2', 'Presence: doctor sees Maya online; patient sees doctor online; offline on leave', async () => {
    await waitFor(
      async () => (await d.getByRole('button', { name: /^Maya Johnson, \d+ years, online/ }).count()) > 0,
      "Maya's card to say online",
    );
    await clickTab(p, 'Care');
    await waitForText(p, 'Online now', 'doctor online on Care');
    await shot(p, '02-patient-care-online');
    // A second patient (Jordan) comes and goes.
    const j = await newRoleContext(browser, 'patient', 'jordan');
    await go(j.page, '/login');
    await j.page.getByLabel('Email').fill('jordan@brian.demo');
    await j.page.getByLabel('Password', { exact: true }).fill('any');
    await j.page.getByRole('button', { name: /Continue/ }).click();
    await waitForUrl(j.page, /\/patient$/);
    await waitFor(async () => (await d.getByRole('button', { name: /^Jordan Lee, .*\bonline\b/ }).count()) > 0, 'Jordan online');
    await shot(d, '02-doctor-presence');
    await j.ctx.close();
    await waitFor(async () => (await d.getByRole('button', { name: /^Jordan Lee, .*\boffline\b/ }).count()) > 0, 'Jordan offline after leaving');
  });

  // 3 ── Chat
  const m1 = `Hi Dr. Reyes, quick question (e2e ${RUN})`;
  const m2 = `Of course, Maya — ask away (e2e ${RUN})`;
  const m3 = `Also: remember your labs (e2e ${RUN})`;
  const m4 = `Thanks, will do! (e2e ${RUN})`;
  await step('3a', 'Chat: typing indicator, live delivery both ways, read receipts', async () => {
    await openPatientChat();
    await openDoctorThread();
    const box = p.getByLabel('Message', { exact: true });
    await clickOnTop(box, 'patient composer');
    await box.pressSequentially(m1.slice(0, 12), { delay: 25 });
    await waitForText(d, 'typing…', 'doctor sees "typing…"');
    await shot(d, '03-doctor-sees-typing');
    await box.pressSequentially(m1.slice(12), { delay: 5 });
    await box.press('Enter');
    await waitFor(async () => await bubbleLabel(d, m1), 'doctor receives the message live (bubble in the thread)');
    await waitFor(async () => /\. Seen /.test((await bubbleLabel(p, m1)) ?? ''), 'patient bubble shows "Seen"');
    const dbox = d.getByLabel('Message', { exact: true });
    await dbox.click();
    await dbox.pressSequentially(m2.slice(0, 10), { delay: 25 });
    await waitForText(p, 'typing…', 'patient sees "typing…"');
    await dbox.pressSequentially(m2.slice(10), { delay: 5 });
    await dbox.press('Enter');
    await waitFor(async () => await bubbleLabel(p, m2), 'patient receives the reply live (bubble in the thread)');
    await waitFor(async () => /\. Seen /.test((await bubbleLabel(d, m2)) ?? ''), 'doctor bubble shows "Seen"');
    await waitForNoText(d, 'typing…', 'typing indicator clears');
    await shot(p, '03-patient-chat');
    await shot(d, '03-doctor-chat');
  });

  await step('3b', 'Chat: toasts + unread badges on both sides; Sent → Seen', async () => {
    await clickTab(p, 'Home');
    await send(d, m3);
    await toastWith(p, m3, 'patient toast for the new message');
    await waitFor(async () => (await tabBadge(p, 'Care')) >= 1, 'Care tab unread badge');
    await shot(p, '03-patient-toast-badge');
    await clickTab(d, 'Patients');
    const before = await tabBadge(d, 'Messages');
    await openPatientChat(); // marks m3 read
    await waitFor(async () => (await tabBadge(p, 'Care')) === 0, 'Care badge clears after reading');
    await send(p, m4);
    await toastWith(d, m4, 'doctor toast for the new message');
    await waitFor(async () => (await tabBadge(d, 'Messages')) === before + 1, `Messages badge ${before} → ${before + 1}`);
    await waitFor(async () => /\. Sent$/.test((await bubbleLabel(p, m4)) ?? ''), 'patient bubble shows "Sent" while unread');
    await shot(d, '03-doctor-toast-badge');
    await openDoctorThread();
    await waitFor(async () => /\. Seen /.test((await bubbleLabel(p, m4)) ?? ''), 'patient bubble flips to "Seen" live');
    await waitFor(async () => (await tabBadge(d, 'Messages')) === before, 'doctor Messages badge drops back');
  });

  await step('3c', 'Chat: patient shares a visit note → attachment card on both sides', async () => {
    const token = await apiLogin(DEMO.patient.email);
    const { notes } = await api('GET', '/api/notes', { token });
    if (!notes.length) throw new Error('Maya has no visit notes');
    await go(p, `/patient/care/notes/${encodeURIComponent(notes[0].id)}`);
    await waitForText(p, notes[0].title, 'visit note screen');
    await clickOnTop(p.getByRole('button', { name: /^Ask Dr\. .* about this note$/ }), 'Ask Dr. … about this note');
    await waitForUrl(p, /\/patient\/care\/chat/);
    await waitForText(p, 'VISIT NOTE', 'attachment card in the patient chat');
    await waitFor(async () => (await bubbleLabel(d, 'I have a question about this visit note.'))?.includes('attached'), 'doctor bubble has an attachment');
    await shot(p, '03-patient-attachment');
    await shot(d, '03-doctor-attachment');
  });

  // 4 ── Prescriptions
  const tag = `[e2e ${RUN}]`;
  const segCount = async (name) => {
    const l = await p.getByRole('radio', { name: new RegExp(`^${name}, \\d+$`) }).first().getAttribute('aria-label');
    return Number(/(\d+)$/.exec(l ?? '')?.[1] ?? NaN);
  };
  await step('4a', 'Doctor prescribes → patient Meds + Home update live with a toast', async () => {
    await openMayaChart();
    await clickTab(p, 'Meds');
    await waitForText(p, 'Active');
    await dismissToasts(p);
    await d.getByLabel(/^Write a new prescription for /).click();
    await waitForUrl(d, /\/doctor\/patients\/prescribe/);
    await d.getByLabel('Drug name').fill('Amlodipine');
    await d.getByLabel('Strength').fill('5 mg');
    await d.getByLabel('Dose', { exact: true }).fill('1 tablet');
    await d.getByLabel('Instructions').fill(`Take once daily in the morning. ${tag}`);
    await d.getByLabel('Purpose').fill('Blood pressure');
    await shot(d, '04-prescribe-form');
    await d.getByRole('button', { name: 'Send prescription' }).click();
    await waitForUrl(d, /\/doctor\/patients\/[^/?]+$/);
    await waitFor(async () => (await p.getByRole('button', { name: /^Amlodipine 5 mg, / }).count()) > 0, 'Amlodipine on patient Meds');
    await toastWith(p, 'prescribed Amlodipine', 'patient "New prescription" toast');
    await shot(p, '04-patient-meds-live');
    await clickTab(p, 'Home');
    await waitFor(async () => (await p.getByRole('checkbox', { name: /^Amlodipine 5 mg/ }).count()) > 0, 'Amlodipine dose on Home');
  });

  await step('4b', 'Doctor edits / pauses / discontinues → patient sees each change live', async () => {
    await d.getByLabel('Edit Amlodipine 5 mg').click();
    await waitForUrl(d, /rxId=/);
    await d.getByLabel('Strength').fill('10 mg');
    await d.getByRole('button', { name: 'Save changes' }).click();
    await waitForUrl(d, /\/doctor\/patients\/[^/?]+$/);
    await waitFor(async () => (await p.getByRole('checkbox', { name: /^Amlodipine 10 mg/ }).count()) > 0, 'Home shows the edited strength');
    await clickTab(p, 'Meds');
    const paused0 = await segCount('Paused');
    const past0 = await segCount('Past');
    await d.getByLabel('Pause Amlodipine 10 mg').click();
    await waitFor(async () => (await segCount('Paused')) === paused0 + 1, `Paused count ${paused0} → ${paused0 + 1}`);
    await toastWith(p, 'paused Amlodipine');
    await shot(p, '04-patient-paused');
    await d.getByLabel('Discontinue Amlodipine 10 mg').click();
    await d.getByRole('button', { name: /^Discontinue$/ }).last().click();
    await waitFor(async () => (await segCount('Past')) === past0 + 1, `Past count ${past0} → ${past0 + 1}`);
    await waitFor(async () => (await segCount('Paused')) === paused0, 'Paused count back');
    await waitFor(async () => (await d.getByLabel('Discontinue Amlodipine 10 mg').count()) === 0, 'chart hides the stopped Rx');
    await shot(p, '04-patient-discontinued');
  });

  // 5 ── Doses → adherence grid
  await step('5', 'Patient logs / undoes a dose → doctor adherence grid + inbox activity update live', async () => {
    await openMayaChart();
    const grid = d.locator('[aria-label^="Lisinopril 10 mg, last"]');
    await waitFor(async () => (await grid.count()) > 0, 'Lisinopril adherence grid on the chart');
    await clickTab(p, 'Home');
    const row = p.getByRole('checkbox', { name: /^Lisinopril 10 mg/ }).first();
    await row.waitFor();
    if ((await row.getAttribute('aria-checked')) === 'true') {
      const was = await labelOf(grid);
      await row.click();
      await waitFor(async () => (await row.getAttribute('aria-checked')) === 'false', 'pre-clean undo');
      await waitFor(async () => (await labelOf(grid)) !== was, 'grid settles after pre-clean');
    }
    const l0 = await labelOf(grid);
    await row.click();
    await waitFor(async () => (await row.getAttribute('aria-checked')) === 'true', 'dose shows as taken');
    await waitFor(async () => (await labelOf(grid)) !== l0, 'doctor grid changes after the dose is logged');
    await grid.first().scrollIntoViewIfNeeded();
    await shot(d, '05-doctor-grid-logged');
    await row.click();
    await waitFor(async () => (await row.getAttribute('aria-checked')) === 'false', 'dose undone');
    await waitFor(async () => (await labelOf(grid)) === l0, 'doctor grid returns to the original state after undo');
    // Inbox live activity
    await clickTab(d, 'Inbox');
    await row.click();
    await waitForText(d, 'Maya logged a dose', 'inbox live activity');
    await shot(d, '05-doctor-inbox-activity');
    await row.click();
    await waitFor(async () => (await row.getAttribute('aria-checked')) === 'false', 'dose undone again');
    return (await labelOf(grid))?.split('. ').slice(1, 2).join('');
  });

  // 6 ── Refills
  await step('6', 'Refill: patient requests Metformin → doctor inbox live → approve 3 → patient sees it', async () => {
    const token = await apiLogin(DEMO.patient.email);
    const met = (await api('GET', '/api/prescriptions', { token })).prescriptions.find(
      (rx) => rx.drugName === 'Metformin' && rx.status === 'active',
    );
    const r0 = met.refillsRemaining;
    await clickTab(d, 'Inbox');
    await clickTab(p, 'Meds');
    await dismissToasts(p);
    await clickOnTop(p.getByRole('button', { name: /^Metformin 500 mg, / }), 'Metformin card');
    await waitForUrl(p, /\/patient\/meds\/[^/]+$/);
    await clickOnTop(p.getByRole('button', { name: /^Request (refill|renewal)/ }), 'Request refill button');
    await p.getByLabel(/Note for your doctor/).fill(`Almost out ${tag}`);
    await p.getByRole('button', { name: 'Send request' }).click();
    await toastWith(p, 'Refill requested');
    await waitForText(d, `Almost out ${tag}`, 'doctor inbox shows the request live');
    await shot(d, '06-doctor-inbox-request');
    // The chart (still mounted under the Inbox) has the same buttons — click the ones on screen.
    await clickOnTop(d.getByLabel('Approve refill of Metformin 500 mg'), 'Approve on the inbox card');
    await clickOnTop(d.getByLabel('Increase refills to add'), 'refills +1');
    await clickOnTop(d.getByLabel('Increase refills to add'), 'refills +1');
    await clickOnTop(d.getByRole('button', { name: 'Approve 3 refills' }), 'Approve 3 refills');
    const want = `${r0 + 3} refill${r0 + 3 === 1 ? '' : 's'} left`;
    await waitForText(p, 'Approved', 'patient sees "Approved"');
    await waitForText(p, want, `patient sees "${want}"`);
    await shot(p, '06-patient-approved');
    const after = (await api('GET', '/api/prescriptions', { token })).prescriptions.find((rx) => rx.id === met.id);
    if (after.refillsRemaining !== r0 + 3) throw new Error(`API refillsRemaining ${after.refillsRemaining}, expected ${r0 + 3}`);
    return `${r0} → ${r0 + 3} refills`;
  });

  // 7 ── Visit note → Explain with BRIAN
  const noteTitle = `Telehealth check-in ${RUN}`;
  await step('7', 'Doctor writes a note → patient toast → note → Explain with BRIAN (glossary + sources)', async () => {
    await clickTab(p, 'Care');
    await dismissToasts(p);
    await openMayaChart();
    await d.getByLabel(/^Write a visit note for /).click();
    await waitForUrl(d, /\/doctor\/patients\/note/);
    await d.getByLabel('Title', { exact: true }).fill(noteTitle);
    await d
      .getByLabel('Note', { exact: true })
      .fill('Pt seen via telehealth. BP 132/84. Cont lisinopril 10 mg PO qd. Check BMP & A1c in 3 mo. RTC PRN.');
    await d.getByRole('button', { name: /^Share with / }).click();
    await toastWith(p, noteTitle, 'patient "New visit note" toast');
    await shot(p, '07-patient-note-toast');
    await p.locator(`[role="button"][aria-label*="${noteTitle}"][aria-live]`).first().click();
    await waitForUrl(p, /\/patient\/care\/notes\//);
    await waitForText(p, noteTitle);
    const before = await aiAnswers(p);
    await clickOnTop(p.getByRole('button', { name: /^Explain this with BRIAN$/ }), 'Explain this with BRIAN');
    await waitForUrl(p, /\/patient\/ai/);
    await waitForAiAnswer(p, before);
    const demo = (await p.getByLabel('Demo mode answer').count()) > 0;
    if (demo) {
      // The mock translates shorthand line by line: "Cont lisinopril 10 mg PO qd." → "… by mouth once a day."
      await waitFor(async () => (await p.locator('text=/→.*by mouth once a day/').count()) > 0, 'glossary translation of "PO qd"');
    }
    await shot(p, '07-patient-explain');
    return demo ? 'demo mode' : 'Claude';
  });

  // 8 ── BRIAN AI
  await step('8', 'BRIAN AI: medication question, emergency triage (911), history persists', async () => {
    await clickTab(p, 'BRIAN AI');
    const newChat = p.getByLabel('New chat');
    if (await newChat.isEnabled()) await newChat.click();
    await p.getByLabel(/^Medications & dosing mode/).click();
    await p.getByLabel('Your question').fill('Can I take ibuprofen with my lisinopril?');
    await p.getByLabel('Send question').click();
    await waitForAiAnswer(p, 0);
    await waitForText(p, /NSAID/i, 'medication answer mentions NSAIDs');
    await shot(p, '08-ai-medication');
    await p.getByLabel('New chat').click();
    await waitFor(async () => (await aiAnswers(p)) === 0, 'new chat is empty');
    await p.getByLabel('Your question').fill('I have crushing chest pain spreading to my left arm and I am sweating');
    await p.getByLabel('Send question').click();
    await waitForAiAnswer(p, 0);
    await waitForText(p, 'EMERGENCY — ACT NOW', 'emergency triage banner');
    await waitForText(p, 'Call 911', '"Call 911" action');
    await shot(p, '08-ai-emergency');
    await p.getByLabel('Conversation history').click();
    await waitForText(p, 'Can I take ibuprofen with my lisinopril?');
    await waitForText(p, 'I have crushing chest pain');
    await p.reload();
    await waitForText(p, 'Can I take ibuprofen with my lisinopril?', 'history survives a reload', { timeout: 30_000 });
    await shot(p, '08-ai-history');
  });

  // 9 ── Lessons
  await step('9', 'Lessons: open, quiz, mark complete, Ask BRIAN deep link', async () => {
    await clickTab(p, 'Lessons');
    await waitForText(p, 'Browse by topic');
    await clickOnTop(p.locator('[aria-label^="Start here: "]'), 'a "Start here" lesson');
    await waitForUrl(p, /\/patient\/lessons\/[^/]+$/);
    const groups = p.getByRole('radiogroup', { name: /^Question \d+ of \d+$/ });
    await waitFor(async () => (await groups.count()) > 0, 'quiz questions');
    const n = await groups.count();
    for (let i = 0; i < n; i++) {
      await groups.nth(i).scrollIntoViewIfNeeded();
      await groups.nth(i).getByRole('radio').first().click();
    }
    await waitForText(p, /You got \d of \d right/, 'quiz score');
    await waitForText(p, 'Lesson completed', 'finishing the quiz completes the lesson');
    await p.getByLabel('Mark lesson as not completed').click();
    await p.getByRole('button', { name: /Mark complete/ }).click();
    await waitForText(p, 'Lesson completed', 'Mark complete');
    await shot(p, '09-lesson-complete');
    const ask = p.locator('[aria-label^="Ask BRIAN: "]').first();
    const question = (await ask.getAttribute('aria-label')).replace(/^Ask BRIAN: /, '');
    await ask.scrollIntoViewIfNeeded();
    await ask.click();
    await waitForUrl(p, /\/patient\/ai/);
    await waitForText(p, 'Lesson follow-up', 'AI opens in lesson follow-up mode');
    // The question shows twice: the prompt chip on the (still mounted) lesson + the user bubble in the chat.
    await waitFor(async () => (await p.getByText(question, { exact: true }).count()) >= 2, 'lesson question sent to BRIAN');
    await waitFor(async () => (await aiAnswers(p)) >= 1, 'an answer to the lesson question', { timeout: 60_000 });
    await waitFor(async () => (await p.getByLabel('Waiting for the answer').count()) === 0, 'BRIAN AI to be idle', { timeout: 60_000 });
    await shot(p, '09-lesson-ask-brian');
    return n + ' quiz questions';
  });

  // 10 ── Profile + server down/up
  const allergy = `Latex (e2e ${RUN})`;
  await step('10a', 'Patient edits allergies → doctor chart updates live', async () => {
    await openMayaChart();
    await go(p, '/patient/profile');
    await p.getByLabel('Allergies', { exact: true }).fill(allergy);
    await p.getByLabel('Add to Allergies').click();
    await p.getByRole('button', { name: 'Save changes' }).click();
    await toastWith(p, 'Profile saved');
    await waitForText(d, allergy, 'doctor chart shows the new allergy');
    await shot(d, '10-doctor-allergy');
  });

  await step('10b', 'Server down → "Reconnecting" banner on both → server back → live again', async () => {
    if (!server) return { skip: 'needs --managed / E2E_MANAGE_SERVER=1' };
    await clickTab(p, 'Home');
    await waitForText(p, /Today[’']s doses/);
    await server.stop();
    await waitForText(p, 'Reconnecting to BRIAN', 'patient banner', { timeout: 20_000 });
    await waitForText(d, 'Reconnecting to BRIAN', 'doctor banner', { timeout: 20_000 });
    await shot(p, '10-patient-server-down');
    await shot(d, '10-doctor-server-down');
    await server.start();
    await waitForNoText(p, 'Reconnecting to BRIAN', 'patient reconnects', { timeout: 30_000 });
    await waitForNoText(d, 'Reconnecting to BRIAN', 'doctor reconnects', { timeout: 30_000 });
    await openPatientChat();
    await openDoctorThread();
    const msg = `Back online (e2e ${RUN})`;
    await send(p, msg);
    await waitForText(d, msg, 'live message after the restart');
  });

  // ── cleanup + summary
  try {
    if (cleanup.allergies) {
      const token = await apiLogin(DEMO.patient.email);
      await api('PATCH', '/api/me', { token, body: { patient: { allergies: cleanup.allergies } } });
    }
  } catch (e) {
    console.log(dim(`  cleanup warning: ${e.message}`));
  }
  await browser.close();
  await server?.stop().catch(() => {});

  const failed = results.filter((r) => r.status === 'fail');
  const passed = results.filter((r) => r.status === 'pass');
  console.log(`\n${passed.length} passed, ${failed.length} failed, ${results.length - passed.length - failed.length} skipped`);
  if (consoleErrors.length) {
    console.log(dim(`\nBrowser console errors (${consoleErrors.length}, not counted as failures):`));
    for (const e of [...new Set(consoleErrors)].slice(0, 15)) console.log(dim(`  ${e.slice(0, 200)}`));
  }
  console.log(dim(`\nScreenshots: ${config.shots}`));
  fs.writeFileSync(path.join(config.shots, 'results.json'), JSON.stringify({ run: RUN, config, results, consoleErrors }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error(red(err.stack ?? String(err)));
  await server?.stop().catch(() => {});
  process.exit(1);
});
