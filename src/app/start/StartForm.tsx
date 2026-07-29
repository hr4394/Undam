"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { INTEREST_AREAS, INTEREST_LABELS, type InterestArea } from "@/domain/types";
import { searchCities } from "@/domain/location/cities";
import { submitBirthAction } from "@/app/actions";
import { siteConfig } from "@/config/site";

type Draft = {
  nickname: string;
  gender: "male" | "female" | "unspecified";
  calendar: "solar" | "lunar";
  isLeapMonth: boolean;
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  birthTimeUnknown: boolean;
  countryCode: string;
  cityId: string;
  cityLabel: string;
  interests: InterestArea[];
  concernText: string;
  tone: "warm" | "analytic" | "concise";
  agreeService: boolean;
  agreePrivacy: boolean;
  agreeAge: boolean;
  agreeMarketing: boolean;
};

const EMPTY: Draft = {
  nickname: "", gender: "unspecified", calendar: "solar", isLeapMonth: false,
  year: "", month: "", day: "", hour: "", minute: "", birthTimeUnknown: false,
  countryCode: "KR", cityId: "", cityLabel: "", interests: [], concernText: "",
  tone: "warm", agreeService: false, agreePrivacy: false, agreeAge: false,
  agreeMarketing: false,
};

const DRAFT_KEY = "undam.draft.v1";
const STEP_TITLES = [
  "이름", "생년월일", "출생 시간", "출생지", "관심 분야", "확인 및 동의",
];

export function StartForm() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [cityQuery, setCityQuery] = useState("");
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);

  // 임시 저장 복구 (sessionStorage + TTL, 민감정보 장기 평문 저장 금지)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { exp: number; data: Draft };
        // 외부 시스템(sessionStorage)에서 마운트 후 복구 — 하이드레이션 불일치 방지를 위해 effect 사용
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (parsed.exp > Date.now()) setD({ ...EMPTY, ...parsed.data });
        else sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const ttl = (siteConfig.draftTtlMinutes ?? 120) * 60 * 1000;
    sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ exp: Date.now() + ttl, data: d }),
    );
  }, [d, loaded]);

  const cityResults = useMemo(() => searchCities(cityQuery), [cityQuery]);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setD((prev) => ({ ...prev, [k]: v }));
  }

  function validateStep(): string | null {
    switch (step) {
      case 0:
        if (!d.nickname.trim()) return "이름 또는 닉네임을 입력하세요.";
        return null;
      case 1: {
        const y = Number(d.year), m = Number(d.month), day = Number(d.day);
        if (!y || y < 1900 || y > 2100) return "연도를 확인하세요 (1900~2100).";
        if (!m || m < 1 || m > 12) return "월을 확인하세요.";
        if (!day || day < 1 || day > 31) return "일을 확인하세요.";
        if (d.calendar === "solar") {
          const dt = new Date(Date.UTC(y, m - 1, day));
          if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== day)
            return "존재하지 않는 날짜입니다.";
        }
        return null;
      }
      case 2:
        if (!d.birthTimeUnknown) {
          const h = Number(d.hour);
          if (d.hour === "" || h < 0 || h > 23) return "시(0~23)를 입력하거나 '시간 모름'을 선택하세요.";
          const mi = Number(d.minute || "0");
          if (mi < 0 || mi > 59) return "분(0~59)을 확인하세요.";
        }
        return null;
      case 3:
        if (!d.cityId) return "출생 도시를 선택하세요.";
        return null;
      case 4:
        if (d.interests.length === 0) return "관심 분야를 하나 이상 선택하세요.";
        return null;
      case 5:
        if (!d.agreeService || !d.agreePrivacy || !d.agreeAge)
          return "필수 항목에 동의해야 결과를 확인할 수 있습니다.";
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }
  function prev() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    startTransition(async () => {
      const res = await submitBirthAction({
        nickname: d.nickname.trim(),
        gender: d.gender,
        calendar: d.calendar,
        isLeapMonth: d.calendar === "lunar" ? d.isLeapMonth : false,
        year: Number(d.year),
        month: Number(d.month),
        day: Number(d.day),
        hour: d.birthTimeUnknown ? null : Number(d.hour),
        minute: d.birthTimeUnknown ? null : Number(d.minute || "0"),
        birthTimeUnknown: d.birthTimeUnknown,
        countryCode: d.countryCode,
        cityId: d.cityId,
        interests: d.interests,
        concernText: d.concernText.trim() || undefined,
        tone: d.tone,
      });
      // 성공 시 redirect 로 이 코드에 도달하지 않음
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div style={{ paddingBottom: 96 }}>
      {/* 진행 상태 */}
      <div className="container-m" style={{ paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Link href="/" className="btn-ghost" style={{ padding: 0, fontSize: 14 }}>← 처음으로</Link>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>
            {step + 1} / {STEP_TITLES.length} · {STEP_TITLES[step]}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "rgba(35,39,54,0.08)", overflow: "hidden" }} aria-hidden>
          <div style={{ height: "100%", width: `${((step + 1) / STEP_TITLES.length) * 100}%`, background: "var(--accent-gold)", transition: "width 250ms ease" }} />
        </div>
      </div>

      <div className="container-m" style={{ marginTop: 20 }}>
        <div className="card" style={{ padding: 18, minHeight: 260 }}>
          {step === 0 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label className="label" htmlFor="nickname">이름 또는 닉네임</label>
                <input id="nickname" className="input" value={d.nickname}
                  maxLength={20} placeholder="예: 지민, 별밤이"
                  onChange={(e) => set("nickname", e.target.value)} autoFocus />
              </div>
              <div>
                <span className="label">성별 (선택)</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([["female", "여성"], ["male", "남성"], ["unspecified", "비공개"]] as const).map(([v, l]) => (
                    <button key={v} type="button" className={`btn ${d.gender === v ? "btn-primary" : "btn-outline"}`}
                      style={{ flex: 1, minHeight: 48 }} onClick={() => set("gender", v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <span className="label">양력 / 음력</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([["solar", "양력"], ["lunar", "음력"]] as const).map(([v, l]) => (
                    <button key={v} type="button" className={`btn ${d.calendar === v ? "btn-primary" : "btn-outline"}`}
                      style={{ flex: 1 }} onClick={() => set("calendar", v)}>{l}</button>
                  ))}
                </div>
              </div>
              {d.calendar === "lunar" && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
                  <input type="checkbox" checked={d.isLeapMonth} onChange={(e) => set("isLeapMonth", e.target.checked)}
                    style={{ width: 22, height: 22 }} />
                  윤달입니다
                </label>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 8 }}>
                <div>
                  <label className="label" htmlFor="y">연도</label>
                  <input id="y" className="input" inputMode="numeric" value={d.year} placeholder="1995"
                    onChange={(e) => set("year", e.target.value.replace(/\D/g, "").slice(0, 4))} />
                </div>
                <div>
                  <label className="label" htmlFor="m">월</label>
                  <input id="m" className="input" inputMode="numeric" value={d.month} placeholder="3"
                    onChange={(e) => set("month", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
                <div>
                  <label className="label" htmlFor="dd">일</label>
                  <input id="dd" className="input" inputMode="numeric" value={d.day} placeholder="21"
                    onChange={(e) => set("day", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "grid", gap: 16 }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
                출생 시간은 시주·상승궁 계산에 쓰입니다. 모르면 아래를 선택하세요. (시주·상승궁은 제외됩니다)
              </p>
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15 }}>
                <input type="checkbox" checked={d.birthTimeUnknown} style={{ width: 22, height: 22 }}
                  onChange={(e) => set("birthTimeUnknown", e.target.checked)} />
                출생 시간을 모릅니다
              </label>
              {!d.birthTimeUnknown && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label className="label" htmlFor="hh">시 (0~23)</label>
                    <input id="hh" className="input" inputMode="numeric" value={d.hour} placeholder="14"
                      onChange={(e) => set("hour", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                  </div>
                  <div>
                    <label className="label" htmlFor="mm">분 (0~59)</label>
                    <input id="mm" className="input" inputMode="numeric" value={d.minute} placeholder="30"
                      onChange={(e) => set("minute", e.target.value.replace(/\D/g, "").slice(0, 2))} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label className="label" htmlFor="city">출생 도시 검색</label>
                <input id="city" className="input" value={cityQuery} placeholder="예: 서울, 부산, tokyo"
                  onChange={(e) => setCityQuery(e.target.value)} />
              </div>
              <ul style={{ display: "grid", gap: 6, margin: 0, padding: 0, listStyle: "none" }}>
                {cityResults.map((c) => (
                  <li key={c.id}>
                    <button type="button"
                      className={`btn ${d.cityId === c.id ? "btn-primary" : "btn-outline"}`}
                      style={{ width: "100%", justifyContent: "space-between", minHeight: 48 }}
                      onClick={() => { set("cityId", c.id); set("countryCode", c.countryCode); set("cityLabel", `${c.country} · ${c.name}`); }}>
                      <span>{c.country} · {c.name}</span>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.timezone}</span>
                    </button>
                  </li>
                ))}
                {cityResults.length === 0 && (
                  <li style={{ fontSize: 14, color: "var(--text-secondary)" }}>검색 결과가 없습니다. 가장 가까운 대도시를 선택하세요.</li>
                )}
              </ul>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <span className="label">관심 분야 (복수 선택)</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {INTEREST_AREAS.map((a) => {
                    const on = d.interests.includes(a);
                    return (
                      <button key={a} type="button"
                        className={`btn ${on ? "btn-primary" : "btn-outline"}`}
                        style={{ minHeight: 44, padding: "0 14px", fontSize: 14 }}
                        aria-pressed={on}
                        onClick={() => set("interests", on ? d.interests.filter((x) => x !== a) : [...d.interests, a])}>
                        {INTEREST_LABELS[a]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="concern">현재 고민 (선택)</label>
                <textarea id="concern" className="input" style={{ minHeight: 84, resize: "vertical" }}
                  maxLength={500} value={d.concernText} placeholder="예: 이직을 고민 중이에요."
                  onChange={(e) => set("concernText", e.target.value)} />
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  고민은 참고용으로만 쓰입니다.
                </p>
              </div>
              <div>
                <span className="label">결과 문체</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {([["warm", "따뜻한 조언형"], ["analytic", "명확한 분석형"], ["concise", "간결한 핵심형"]] as const).map(([v, l]) => (
                    <button key={v} type="button" className={`btn ${d.tone === v ? "btn-primary" : "btn-outline"}`}
                      style={{ flex: 1, minHeight: 44, fontSize: 13, padding: "0 8px" }} onClick={() => set("tone", v)}>{l}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="card" style={{ padding: 14, background: "var(--background)" }}>
                <p style={{ fontSize: 14, margin: "0 0 8px", fontWeight: 600 }}>입력 확인</p>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.9 }}>
                  <li>{d.nickname} · {d.gender === "female" ? "여성" : d.gender === "male" ? "남성" : "비공개"}</li>
                  <li>{d.calendar === "solar" ? "양력" : "음력"}{d.calendar === "lunar" && d.isLeapMonth ? "(윤달)" : ""} {d.year}.{d.month}.{d.day}</li>
                  <li>{d.birthTimeUnknown ? "출생 시간 모름" : `${d.hour || 0}시 ${d.minute || 0}분`}</li>
                  <li>{d.cityLabel || "도시 미선택"}</li>
                  <li>관심: {d.interests.map((i) => INTEREST_LABELS[i]).join(", ")}</li>
                </ul>
              </div>
              {([
                ["agreeService", "[필수] 이용약관에 동의합니다."],
                ["agreePrivacy", "[필수] 개인정보 처리(민감정보 포함)에 동의합니다."],
                ["agreeAge", "[필수] 만 14세 이상입니다."],
                ["agreeMarketing", "[선택] 마케팅 정보 수신에 동의합니다."],
              ] as const).map(([k, l]) => (
                <label key={k} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
                  <input type="checkbox" checked={d[k]} style={{ width: 22, height: 22, marginTop: 1 }}
                    onChange={(e) => set(k, e.target.checked)} />
                  <span>{l}</span>
                </label>
              ))}
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                입력한 출생정보는 계산과 해석에만 사용되며, 보존 기간({siteConfig.retentionDays}일) 후 또는 삭제 요청 시 파기됩니다.
              </p>
            </div>
          )}
        </div>

        {error && (
          <p role="alert" style={{ color: "var(--accent-red)", fontSize: 14, marginTop: 12, fontWeight: 600 }}>
            {error}
          </p>
        )}
      </div>

      {/* 하단 이동 바 */}
      <div className="sticky-bar">
        <div className="container-m" style={{ padding: 0, display: "flex", gap: 10 }}>
          {step > 0 && (
            <button type="button" className="btn btn-outline" style={{ flex: "0 0 96px" }} onClick={prev}>이전</button>
          )}
          {step < STEP_TITLES.length - 1 ? (
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={next}>다음</button>
          ) : (
            <button type="button" className="btn btn-gold" style={{ flex: 1 }} disabled={pending} onClick={submit}>
              {pending ? "계산하는 중…" : "무료 결과 확인하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
