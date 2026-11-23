/**
 * SCREEN INTERFACES (rendered inside LaptopFront / Phone, 1280 x 800 canvas).
 * Generic, unbranded UIs. No real employers, people or logos.
 */
import React from 'react';
import {palette} from '../theme/palette';
import {fonts} from '../theme/typography';
import {clamp, ease, ramp} from '../lib/anim';

const ui = {
  bg: '#0f1729',
  panel: '#162139',
  panel2: '#1c2945',
  line: '#26355a',
  text: '#e8edf7',
  dim: '#8f9cb8',
  accent: palette.orange,
  blue: palette.blue,
};

const base: React.CSSProperties = {fontFamily: fonts.body, color: ui.text, position: 'absolute', inset: 0, background: ui.bg};

/* ---------------- Browser chrome ---------------- */

export const Browser: React.FC<{tabs: string[]; active: number; url: string; children: React.ReactNode; closing?: number}> = ({
  tabs,
  active,
  url,
  children,
}) => (
  <div style={base}>
    <div style={{height: 56, background: '#0a1020', display: 'flex', alignItems: 'flex-end', padding: '0 16px', gap: 6}}>
      <div style={{display: 'flex', gap: 8, alignSelf: 'center', marginRight: 14}}>
        {['#e86f5c', '#e8b15c', '#6fcf97'].map((c) => (
          <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.8}} />
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={i}
          style={{
            height: 42,
            padding: '0 18px',
            borderRadius: '10px 10px 0 0',
            background: i === active ? ui.bg : '#131b2e',
            color: i === active ? ui.text : ui.dim,
            fontSize: 17,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 230,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          <div style={{width: 14, height: 14, borderRadius: 4, background: i === active ? ui.accent : ui.line}} />
          {t}
        </div>
      ))}
    </div>
    <div style={{height: 50, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${ui.line}`}}>
      <div style={{flex: 1, height: 34, borderRadius: 17, background: ui.panel, display: 'flex', alignItems: 'center', padding: '0 18px', color: ui.dim, fontSize: 16}}>
        {url}
      </div>
    </div>
    <div style={{position: 'absolute', top: 106, left: 0, right: 0, bottom: 0}}>{children}</div>
  </div>
);

/* ---------------- Job board ---------------- */

export const JOBS = [
  'Digital Marketing Executive',
  'Project Coordinator',
  'Operations Specialist',
  'Business Development Associate',
  'Content & Social Media Lead',
  'Account Manager',
];

type Status = 'applied' | 'rejected' | 'pending' | 'none' | 'interview';
const pill: Record<Status, {label: string; bg: string; fg: string}> = {
  none: {label: 'Apply', bg: ui.accent, fg: '#1a0f06'},
  applied: {label: 'Applied', bg: '#24406b', fg: '#cfe0ff'},
  pending: {label: 'No response', bg: '#2a3350', fg: ui.dim},
  rejected: {label: 'Not selected', bg: '#4a2a2a', fg: '#f3b3a8'},
  interview: {label: 'Interview', bg: '#2d4a3a', fg: '#a6e8c2'},
};

export const JobBoard: React.FC<{statuses: Status[]; highlight?: number; scroll?: number}> = ({statuses, highlight = -1, scroll = 0}) => (
  <div style={{padding: '26px 40px', transform: `translateY(${-scroll}px)`}}>
    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18}}>
      <div style={{fontSize: 30, fontWeight: 800}}>Jobs in UAE</div>
      <div style={{color: ui.dim, fontSize: 17}}>{statuses.filter((s) => s !== 'none').length} applications</div>
    </div>
    {statuses.map((s, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '18px 22px',
          marginBottom: 12,
          borderRadius: 14,
          background: i === highlight ? ui.panel2 : ui.panel,
          border: `1px solid ${i === highlight ? ui.accent : ui.line}`,
        }}
      >
        <div style={{width: 54, height: 54, borderRadius: 12, background: ui.line}} />
        <div style={{flex: 1}}>
          <div style={{fontSize: 21, fontWeight: 700}}>{JOBS[i % JOBS.length]}</div>
          <div style={{fontSize: 16, color: ui.dim, marginTop: 4}}>Dubai · Full-time · Company confidential</div>
        </div>
        <div style={{padding: '9px 18px', borderRadius: 20, fontSize: 19, fontWeight: 800, background: pill[s].bg, color: pill[s].fg, whiteSpace: 'nowrap'}}>{pill[s].label}</div>
      </div>
    ))}
  </div>
);

/* ---------------- Empty inbox ---------------- */

export const EmptyInbox: React.FC<{refresh: number}> = ({refresh}) => (
  <div style={{display: 'flex', height: '100%'}}>
    <div style={{width: 210, borderRight: `1px solid ${ui.line}`, padding: 20}}>
      {['Inbox', 'Starred', 'Sent', 'Drafts', 'Archive'].map((f, i) => (
        <div
          key={f}
          style={{
            padding: '12px 16px',
            borderRadius: 10,
            marginBottom: 6,
            fontSize: 18,
            fontWeight: i === 0 ? 700 : 500,
            background: i === 0 ? ui.panel2 : 'transparent',
            color: i === 0 ? ui.text : ui.dim,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {f}
          {i === 0 && <span style={{color: ui.dim}}>0</span>}
          {i === 2 && <span style={{color: ui.dim}}>47</span>}
        </div>
      ))}
    </div>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: 55,
          border: `3px solid ${ui.line}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${refresh * 360}deg)`,
        }}
      >
        <div style={{width: 46, height: 34, border: `3px solid ${ui.dim}`, borderRadius: 6}} />
      </div>
      <div style={{fontSize: 40, fontWeight: 800}}>No new messages</div>
      <div style={{fontSize: 18, color: ui.dim}}>Last checked just now</div>
    </div>
  </div>
);

/* ---------------- Business project board ---------------- */

export const ProjectBoard: React.FC<{progress: number}> = ({progress}) => {
  const items = ['Define the offer', 'Build the website', 'First 10 clients', 'Content plan', 'Pricing'];
  return (
    <div style={{padding: '30px 44px'}}>
      <div style={{fontSize: 30, fontWeight: 800}}>my-business / launch-plan</div>
      <div style={{color: ui.dim, fontSize: 18, marginTop: 6}}>Side project · last edited 2:14 AM</div>
      <div style={{marginTop: 26, height: 16, borderRadius: 8, background: ui.panel2, overflow: 'hidden'}}>
        <div style={{width: `${progress * 100}%`, height: '100%', background: ui.accent}} />
      </div>
      <div style={{marginTop: 8, color: ui.dim, fontSize: 16}}>{Math.round(progress * 100)}% complete</div>
      <div style={{marginTop: 22}}>
        {items.map((it, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '13px 0', borderBottom: `1px solid ${ui.line}`, fontSize: 20}}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                border: `2px solid ${i === 0 ? ui.accent : ui.line}`,
                background: i === 0 ? ui.accent : 'transparent',
              }}
            />
            <span style={{color: i === 0 ? ui.dim : ui.text, textDecoration: i === 0 ? 'line-through' : 'none'}}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Application flow (Scene 05) ---------------- */

const NOTES = [
  {title: 'Application received', body: 'Thank you for applying. We will be in touch.'},
  {title: 'Interview invitation', body: 'Could you join us for a short call on Tuesday?'},
  {title: 'Next steps', body: "We'd like to meet you in person."},
  {title: 'Offer', body: 'Welcome aboard! Your start date is confirmed.'},
];

/** `t` is 0..1 across the narration line. */
export const ApplyDashboard: React.FC<{t: number; frame: number}> = ({t, frame}) => {
  const sent = Math.round(ramp(t, [0.02, 0.55], [1, 58], ease.soft));
  const cards = 5;
  const notesShown = NOTES.filter((_, i) => t > 0.18 + i * 0.2).length;
  const days = Array.from({length: 21}, (_, i) => i);
  const interviewDays = [4, 9, 12, 16];
  return (
    <div style={{...base, display: 'flex', padding: 28, gap: 24}}>
      {/* Applications column */}
      <div style={{flex: 1.15, display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
          <div style={{fontSize: 26, fontWeight: 800}}>Applications</div>
          <div style={{fontFamily: fonts.display, fontSize: 64, color: ui.accent, lineHeight: 1}}>{sent}</div>
        </div>
        {Array.from({length: cards}, (_, i) => {
          const local = clamp((t * 12 - i * 0.55) % 3.2);
          const submitted = local > 0.55;
          const fly = ramp(local, [0.55, 0.9], [0, 1], ease.in);
          return (
            <div
              key={i}
              style={{
                padding: '16px 18px',
                borderRadius: 12,
                background: ui.panel,
                border: `1px solid ${submitted ? '#2f6b4a' : ui.line}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transform: `translateX(${fly * 40}px)`,
                opacity: 1 - fly * 0.4,
              }}
            >
              <div style={{width: 40, height: 40, borderRadius: 10, background: ui.line}} />
              <div style={{flex: 1, fontSize: 18, fontWeight: 600}}>{JOBS[(i + Math.floor(t * 12 / 3.2)) % JOBS.length]}</div>
              <div
                style={{
                  padding: '7px 14px',
                  borderRadius: 16,
                  fontSize: 15,
                  fontWeight: 700,
                  background: submitted ? '#2d4a3a' : ui.accent,
                  color: submitted ? '#a6e8c2' : '#1a0f06',
                }}
              >
                {submitted ? 'Sent ✓' : 'Submit'}
              </div>
            </div>
          );
        })}
      </div>
      {/* Right column: notifications + calendar */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{fontSize: 22, fontWeight: 800}}>Inbox</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, minHeight: 300}}>
          {NOTES.slice(0, notesShown).map((n, i) => {
            const appear = clamp((t - (0.18 + i * 0.2)) * 14);
            return (
              <div
                key={i}
                style={{
                  padding: '13px 16px',
                  borderRadius: 12,
                  background: i === 3 ? '#3a2a18' : ui.panel2,
                  border: `1px solid ${i === 3 ? ui.accent : ui.line}`,
                  transform: `translateY(${(1 - appear) * -20}px)`,
                  opacity: appear,
                }}
              >
                <div style={{fontSize: 17, fontWeight: 700, color: i === 3 ? palette.amber : ui.text}}>{n.title}</div>
                <div style={{fontSize: 15, color: ui.dim, marginTop: 3}}>{n.body}</div>
              </div>
            );
          })}
        </div>
        <div style={{fontSize: 22, fontWeight: 800}}>Interviews</div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6}}>
          {days.map((d) => {
            const idx = interviewDays.indexOf(d);
            const on = idx >= 0 && t > 0.3 + idx * 0.13;
            return (
              <div
                key={d}
                style={{
                  height: 34,
                  borderRadius: 8,
                  background: on ? ui.accent : ui.panel,
                  color: on ? '#1a0f06' : ui.dim,
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: on ? `0 0 ${10 + 6 * Math.sin(frame / 6)}px rgba(242,138,60,0.6)` : undefined,
                }}
              >
                {d + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------------- Workspace (Scene 06) ---------------- */

const CODE = [
  '<header class="nav">',
  '  <a class="logo">project</a>',
  '</header>',
  '<section class="hero">',
  '  <h1>Build something real.</h1>',
  '  <button>Get started</button>',
  '</section>',
  '<section class="services">',
  '  ...',
];

/**
 * Builds up from an empty canvas.
 * blank (0) → notes (exp) → ideas → wireframe + code + plan.
 */
export const Workspace: React.FC<{experience: number; ideas: number; build: number; frame: number}> = ({experience, ideas, build, frame}) => {
  const cursorOn = Math.floor(frame / 15) % 2 === 0;
  const w = (k: number) => clamp(build * 6 - k);
  const codeChars = Math.floor(build * CODE.join('\n').length * 1.15);
  let remaining = codeChars;
  return (
    <div style={{...base, background: '#0d1424'}}>
      {/* top bar */}
      <div style={{height: 54, display: 'flex', alignItems: 'center', padding: '0 24px', borderBottom: `1px solid ${ui.line}`, gap: 14}}>
        <div style={{width: 26, height: 26, borderRadius: 7, border: `2px solid ${ui.accent}`}} />
        <div style={{fontSize: 18, fontWeight: 700}}>Untitled project</div>
        <div style={{marginLeft: 'auto', fontSize: 15, color: ui.dim}}>{build > 0.05 ? 'Saving…' : 'Empty workspace'}</div>
      </div>
      {/* Blank state cursor */}
      {experience < 0.05 && ideas < 0.05 && build < 0.02 && (
        <div style={{position: 'absolute', left: 80, top: 120, fontSize: 30, color: ui.dim}}>
          Start typing…<span style={{opacity: cursorOn ? 1 : 0, color: ui.accent}}>|</span>
        </div>
      )}
      {/* Experience notes */}
      <div style={{position: 'absolute', left: 30, top: 80, width: 300, display: 'flex', flexDirection: 'column', gap: 10}}>
        {['Years of work experience', 'Managed real projects', 'Marketing + operations', 'Know how teams work'].map((s, i) => {
          const a = clamp(experience * 5 - i);
          return (
            <div
              key={i}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: ui.panel,
                borderLeft: `4px solid ${ui.blue}`,
                fontSize: 16,
                fontWeight: 600,
                opacity: a,
                transform: `translateX(${(1 - a) * -30}px)`,
              }}
            >
              {s}
            </div>
          );
        })}
      </div>
      {/* Idea sticky notes */}
      {['Websites for small brands', 'SEO that actually works', 'Document the journey', 'Start with one client'].map((s, i) => {
        const a = clamp(ideas * 5 - i);
        const pos = [
          [360, 90, -4],
          [560, 120, 3],
          [380, 250, 2],
          [590, 270, -3],
        ][i];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: pos[0],
              top: pos[1],
              width: 180,
              height: 120,
              padding: 14,
              background: i % 2 ? '#f6d27a' : '#f4b483',
              color: '#2a1d10',
              fontSize: 18,
              fontWeight: 700,
              borderRadius: 4,
              transform: `rotate(${pos[2]}deg) scale(${0.6 + 0.4 * a})`,
              opacity: a * (1 - clamp(build * 2.5) * 0.65),
              boxShadow: '0 10px 20px rgba(0,0,0,0.35)',
            }}
          >
            {s}
          </div>
        );
      })}
      {/* Website wireframe */}
      <div
        style={{
          position: 'absolute',
          left: 340,
          top: 76,
          width: 540,
          height: 700,
          borderRadius: 14,
          border: `2px solid ${ui.line}`,
          background: '#f3efe7',
          opacity: clamp(build * 6),
          transform: `translateY(${(1 - clamp(build * 6)) * 30}px)`,
          overflow: 'hidden',
        }}
      >
        <div style={{height: 46, background: palette.navy800, opacity: w(1), display: 'flex', alignItems: 'center', padding: '0 18px', gap: 12}}>
          <div style={{width: 70, height: 12, borderRadius: 6, background: palette.orange}} />
          <div style={{marginLeft: 'auto', display: 'flex', gap: 10}}>
            {[0, 1, 2].map((k) => (
              <div key={k} style={{width: 44, height: 8, borderRadius: 4, background: '#4a5a80'}} />
            ))}
          </div>
        </div>
        <div style={{padding: 26, opacity: w(2), transform: `translateY(${(1 - w(2)) * 20}px)`}}>
          <div style={{fontFamily: fonts.display, fontSize: 56, color: palette.navy800, lineHeight: 0.95}}>BUILD SOMETHING REAL.</div>
          <div style={{marginTop: 12, width: '80%', height: 10, borderRadius: 5, background: '#cfc6b5'}} />
          <div style={{marginTop: 8, width: '60%', height: 10, borderRadius: 5, background: '#cfc6b5'}} />
          <div style={{marginTop: 18, width: 150, height: 40, borderRadius: 20, background: palette.orange}} />
        </div>
        <div style={{display: 'flex', gap: 14, padding: '0 26px', opacity: w(3), transform: `translateY(${(1 - w(3)) * 20}px)`}}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{flex: 1, height: 150, borderRadius: 10, background: '#e3dccf', padding: 12}}>
              <div style={{width: 34, height: 34, borderRadius: 8, background: [palette.navy600, palette.orange, palette.beigeDark][k]}} />
              <div style={{marginTop: 12, height: 8, borderRadius: 4, background: '#c2b8a5'}} />
              <div style={{marginTop: 6, width: '70%', height: 8, borderRadius: 4, background: '#c2b8a5'}} />
            </div>
          ))}
        </div>
        <div style={{margin: 26, height: 180, borderRadius: 10, background: palette.navy700, opacity: w(4)}} />
      </div>
      {/* Code editor */}
      <div
        style={{
          position: 'absolute',
          right: 26,
          top: 76,
          width: 360,
          height: 420,
          borderRadius: 12,
          background: '#0a0f1c',
          border: `1px solid ${ui.line}`,
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 15,
          lineHeight: 1.6,
          opacity: clamp(build * 5 - 0.5),
        }}
      >
        {CODE.map((line, i) => {
          const shown = line.slice(0, Math.max(0, remaining));
          remaining -= line.length + 1;
          return (
            <div key={i} style={{color: i % 3 === 0 ? '#7fb4ff' : i % 3 === 1 ? '#e8edf7' : '#f4b483', whiteSpace: 'pre', minHeight: 24}}>
              {shown}
              {remaining <= 0 && remaining > -line.length - 1 && cursorOn ? <span style={{color: ui.accent}}>▍</span> : null}
            </div>
          );
        })}
      </div>
      {/* Business plan checklist */}
      <div
        style={{
          position: 'absolute',
          right: 26,
          top: 516,
          width: 360,
          height: 258,
          borderRadius: 12,
          background: ui.panel,
          border: `1px solid ${ui.line}`,
          padding: 18,
          opacity: clamp(build * 4 - 1.4),
        }}
      >
        <div style={{fontSize: 18, fontWeight: 800, marginBottom: 10}}>Business plan</div>
        {['Offer & positioning', 'Website', 'First clients', 'Document everything'].map((s, i) => {
          const done = build > 0.45 + i * 0.12;
          return (
            <div key={i} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', fontSize: 16}}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: done ? ui.accent : 'transparent',
                  border: `2px solid ${done ? ui.accent : ui.line}`,
                }}
              />
              <span style={{color: done ? ui.text : ui.dim}}>{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------- Phone notifications ---------------- */

export const PhoneNotifications: React.FC<{items: {title: string; body: string; t: number}[]; now: number}> = ({items, now}) => (
  <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #1b2747 0%, #0c1224 100%)', fontFamily: fonts.body, color: ui.text}}>
    <div style={{textAlign: 'center', marginTop: 70, fontSize: 76, fontWeight: 300, letterSpacing: -2}}>2:14</div>
    <div style={{textAlign: 'center', fontSize: 20, color: ui.dim}}>Tuesday</div>
    <div style={{margin: '40px 22px', display: 'flex', flexDirection: 'column', gap: 12}}>
      {items
        .filter((n) => now >= n.t)
        .map((n, i) => {
          const a = clamp((now - n.t) / 8);
          return (
            <div
              key={i}
              style={{
                padding: '16px 18px',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.12)',
                opacity: a,
                transform: `translateY(${(1 - a) * -16}px) scale(${0.96 + 0.04 * a})`,
              }}
            >
              <div style={{fontSize: 18, fontWeight: 700}}>{n.title}</div>
              <div style={{fontSize: 16, color: '#c3cbe0', marginTop: 3}}>{n.body}</div>
            </div>
          );
        })}
    </div>
  </div>
);
