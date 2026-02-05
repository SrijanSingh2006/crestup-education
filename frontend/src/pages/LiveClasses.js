import { useMemo, useState } from "react";

const CLASS_FILTERS = ["All", 6, 7, 8, 9, 10, 11, 12];

const DAY_FILTERS = [
  { value: "all", label: "All" },
  { value: "2026-02-06", label: "Fri, Feb 6" },
  { value: "2026-02-07", label: "Sat, Feb 7" },
  { value: "2026-02-08", label: "Sun, Feb 8" },
  { value: "2026-02-09", label: "Mon, Feb 9" },
  { value: "2026-02-10", label: "Tue, Feb 10" },
  { value: "2026-02-11", label: "Wed, Feb 11" },
  { value: "2026-02-12", label: "Thu, Feb 12" }
];

const LIVE_SESSIONS = [
  {
    id: "live-physics-11",
    title: "Physics: Motion in 1D",
    subject: "Physics",
    classLevel: 11,
    teacher: "A. Sharma",
    date: "2026-02-06",
    dateLabel: "Feb 6, 2026",
    time: "6:00 PM",
    duration: "60 min",
    batch: "JEE Track"
  },
  {
    id: "live-maths-10",
    title: "Maths: Quadratic Equations",
    subject: "Maths",
    classLevel: 10,
    teacher: "R. Patel",
    date: "2026-02-07",
    dateLabel: "Feb 7, 2026",
    time: "5:30 PM",
    duration: "50 min",
    batch: "Board Prep"
  },
  {
    id: "live-chem-12",
    title: "Chemistry: Electrochemistry",
    subject: "Chemistry",
    classLevel: 12,
    teacher: "S. Rao",
    date: "2026-02-08",
    dateLabel: "Feb 8, 2026",
    time: "4:30 PM",
    duration: "70 min",
    batch: "NEET Track"
  },
  {
    id: "live-english-8",
    title: "English: Grammar Booster",
    subject: "English",
    classLevel: 8,
    teacher: "N. Kapoor",
    date: "2026-02-09",
    dateLabel: "Feb 9, 2026",
    time: "5:00 PM",
    duration: "45 min",
    batch: "Foundation"
  },
  {
    id: "live-bio-11",
    title: "Biology: Cell Basics",
    subject: "Biology",
    classLevel: 11,
    teacher: "M. Das",
    date: "2026-02-10",
    dateLabel: "Feb 10, 2026",
    time: "6:15 PM",
    duration: "55 min",
    batch: "NEET Track"
  },
  {
    id: "live-maths-9",
    title: "Maths: Polynomials",
    subject: "Maths",
    classLevel: 9,
    teacher: "H. Singh",
    date: "2026-02-11",
    dateLabel: "Feb 11, 2026",
    time: "4:45 PM",
    duration: "50 min",
    batch: "Foundation"
  }
];

export default function LiveClasses() {
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedDay, setSelectedDay] = useState("all");

  const filteredSessions = useMemo(() => {
    return LIVE_SESSIONS.filter((session) => {
      const classMatch =
        selectedClass === "All" || session.classLevel === selectedClass;
      const dayMatch =
        selectedDay === "all" || session.date === selectedDay;
      return classMatch && dayMatch;
    });
  }, [selectedClass, selectedDay]);

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Live Classes</h2>
          <p className="muted">
            Join scheduled sessions with expert teachers and real-time Q&A.
          </p>
        </div>
      </div>

      <section className="live-banner">
        <div>
          <p className="eyebrow">This week</p>
          <h3>Stay on track with live revision and problem solving.</h3>
          <p className="muted">
            Pick your class and day to see upcoming sessions. Add reminders and
            join directly from here.
          </p>
        </div>
        <div className="live-banner-card">
          <span className="live-pill">Next up</span>
          <h4>{LIVE_SESSIONS[0].title}</h4>
          <p className="muted">
            {LIVE_SESSIONS[0].dateLabel} · {LIVE_SESSIONS[0].time}
          </p>
          <button className="btn primary small" type="button">
            Join live
          </button>
        </div>
      </section>

      <div className="live-toolbar">
        <div className="filter-group">
          <span className="filter-label">Class</span>
          <div className="filter-row">
            {CLASS_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-chip ${
                  selectedClass === item ? "active" : ""
                }`}
                onClick={() => setSelectedClass(item)}
              >
                {item === "All" ? "All" : `Class ${item}`}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <span className="filter-label">Day</span>
          <div className="filter-row">
            {DAY_FILTERS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`filter-chip ${
                  selectedDay === day.value ? "active" : ""
                }`}
                onClick={() => setSelectedDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="panel">
          <p>No live sessions match these filters yet.</p>
        </div>
      ) : (
        <div className="live-grid">
          {filteredSessions.map((session) => (
            <div key={session.id} className="live-card">
              <div className="live-card-head">
                <span className="live-pill">Live</span>
                <span className="live-batch">{session.batch}</span>
              </div>
              <h3>{session.title}</h3>
              <p className="muted">
                Class {session.classLevel} · {session.subject}
              </p>
              <div className="live-meta">
                <span>{session.dateLabel}</span>
                <span>{session.time}</span>
                <span>{session.duration}</span>
              </div>
              <div className="live-footer">
                <span className="live-teacher">{session.teacher}</span>
                <button className="btn primary small" type="button">
                  Join live
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
