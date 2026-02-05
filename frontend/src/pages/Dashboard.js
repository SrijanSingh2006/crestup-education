import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";

const LIVE_SESSIONS = [
  {
    title: "Physics: Motion in 1D",
    time: "Feb 6 · 6:00 PM",
    tag: "Live"
  },
  {
    title: "Maths: Quadratic revision",
    time: "Feb 7 · 5:30 PM",
    tag: "Live"
  },
  {
    title: "English: Grammar drill",
    time: "Feb 8 · 4:00 PM",
    tag: "Live"
  }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchEnrollments() {
      if (!user) {
        setEnrolled([]);
        setLoading(false);
        return;
      }

      try {
        const purchaseQuery = query(
          collection(db, "purchases"),
          where("userId", "==", user.uid)
        );
        const purchaseSnap = await getDocs(purchaseQuery);
        const purchasedIds = new Set();
        purchaseSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data?.courseId) purchasedIds.add(data.courseId);
        });

        if (purchasedIds.size === 0) {
          setEnrolled([]);
          return;
        }

        const courseSnap = await getDocs(collection(db, "courses"));
        const courses = courseSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((course) => purchasedIds.has(course.id));
        setEnrolled(courses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
  }, [user]);

  const stats = useMemo(() => {
    const total = enrolled.length;
    return {
      enrolled: total,
      inProgress: total > 0 ? Math.max(1, total - 1) : 0,
      lessons: total * 6,
      live: LIVE_SESSIONS.length
    };
  }, [enrolled.length]);

  const progressItems = useMemo(() => {
    if (enrolled.length === 0) return [];
    const progressValues = [72, 48, 84, 63];
    return enrolled.slice(0, 3).map((course, index) => ({
      title: course.title,
      track: course.subject || course.category || "Core",
      percent: progressValues[index % progressValues.length],
      next: course.nextLesson || "Next up: Practice set 3"
    }));
  }, [enrolled]);

  return (
    <div className="container">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h2>Welcome back, learner</h2>
          <p className="muted">
            Track progress, resume your courses, and plan your next class.
          </p>
        </div>
        <div className="dashboard-cta">
          <button
            className="btn primary"
            type="button"
            onClick={() => {
              if (enrolled.length > 0) {
                navigate(`/courses/${enrolled[0].id}`);
              } else {
                navigate("/courses");
              }
            }}
          >
            Continue learning
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => navigate("/live")}
          >
            View timetable
          </button>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card">
          <p className="stat-label">Courses enrolled</p>
          <h3>{stats.enrolled}</h3>
          <p className="stat-note">{stats.inProgress} in progress</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Lessons completed</p>
          <h3>{stats.lessons}</h3>
          <p className="stat-note">This month</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Live classes</p>
          <h3>{stats.live}</h3>
          <p className="stat-note">Upcoming this week</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-head">
            <h3>My learning</h3>
            <Link to="/courses" className="panel-link">
              View all
            </Link>
          </div>
          {loading ? (
            <p>Loading your courses...</p>
          ) : progressItems.length === 0 ? (
            <div className="empty-state">
              <h4>No courses yet</h4>
              <p className="muted">
                Enroll in a course to see progress and quick actions here.
              </p>
              <Link to="/courses" className="btn primary small">
                Browse courses
              </Link>
            </div>
          ) : (
            <div className="learning-grid">
              {progressItems.map((item) => (
                <div key={item.title} className="learning-card">
                  <div>
                    <h4>{item.title}</h4>
                    <p className="muted">{item.track}</p>
                  </div>
                  <div className="progress-row">
                    <div className="progress-info">
                      <span>Progress</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <span
                        className="progress-fill"
                        style={{ width: `${item.percent}%` }}
                      ></span>
                    </div>
                  </div>
                  <p className="muted">{item.next}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3>Upcoming live classes</h3>
            <Link to="/live" className="panel-link">
              Join live
            </Link>
          </div>
          <div className="schedule-list">
            {LIVE_SESSIONS.map((session) => (
              <div key={session.title} className="schedule-item">
                <div>
                  <p className="schedule-title">{session.title}</p>
                  <p className="muted">{session.time}</p>
                </div>
                <span className="schedule-tag">{session.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="quick-grid">
        <Link to="/courses" className="action-card">
          <span className="action-title">Browse courses</span>
          <p className="muted">Pick a class and continue learning.</p>
          <span className="action-link">Go to courses</span>
        </Link>
        <Link to="/downloads" className="action-card">
          <span className="action-title">Downloads</span>
          <p className="muted">Notes, worksheets, and practice papers.</p>
          <span className="action-link">View downloads</span>
        </Link>
        <Link to="/chat" className="action-card">
          <span className="action-title">Chat support</span>
          <p className="muted">Ask doubts and get quick help.</p>
          <span className="action-link">Start chat</span>
        </Link>
      </section>
    </div>
  );
}
