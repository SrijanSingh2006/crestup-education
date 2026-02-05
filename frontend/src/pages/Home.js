import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

const FEATURED_COURSES = [
  {
    title: "NEET CRACKER",
    subtitle: "75 Days Crash Course for NEET 2026",
    teacher: "By Shyam Sir",
    classLevel: "Class 12",
    price: 999,
    originalPrice: 2000,
    discount: "51% off",
    image: "/featured/neet-cracker.jpg",
    classFilter: 12
  },
  {
    title: "ENGLISH BY AMIT SIR",
    subtitle: "Class 12th Complete English",
    teacher: "By Amit Sir",
    classLevel: "Class 12",
    price: 1499,
    originalPrice: 2000,
    discount: "26% off",
    image: "/featured/english-amit.jpg",
    classFilter: 12
  },
  {
    title: "PHYSICS BY SHYAM SIR",
    subtitle: "Class 12th Complete Physics",
    teacher: "By Shyam Sir",
    classLevel: "Class 12",
    price: 1499,
    originalPrice: 2000,
    discount: "26% off",
    image: "/featured/physics-shyam.jpg",
    classFilter: 12
  }
];

const HIGHLIGHTS = [
  {
    value: "+18%",
    label: "Average score boost",
    note: "Across term assessments"
  },
  {
    value: "24k+",
    label: "Active learners",
    note: "Learning every month"
  },
  {
    value: "150+",
    label: "Live sessions",
    note: "Weekly expert classes"
  }
];

const MENTORS = [
  {
    name: "Shyam Sir",
    subject: "Physics",
    experience: "10+ yrs",
    tag: "Board + NEET"
  },
  {
    name: "Amit Sir",
    subject: "English",
    experience: "8+ yrs",
    tag: "Board Prep"
  },
  {
    name: "Amrit Sir",
    subject: "Biology",
    experience: "9+ yrs",
    tag: "Concept Builder",
    photo: "/teachers/amrit-sir.png"
  }
];

const FEATURED_BATCHES = [
  {
    title: "Foundation Spark",
    level: "Classes 6-8",
    badge: "New",
    lessons: "42 lessons",
    schedule: "Mon, Wed, Fri",
    summary: "Build core concepts with guided practice sets."
  },
  {
    title: "Board Mastery",
    level: "Classes 9-10",
    badge: "Popular",
    lessons: "60 lessons",
    schedule: "Tue, Thu, Sat",
    summary: "Board-focused prep with PYQs and revision tests."
  },
  {
    title: "JEE/NEET Launchpad",
    level: "Classes 11-12",
    badge: "Power Pack",
    lessons: "84 lessons",
    schedule: "Daily",
    summary: "Problem-solving bootcamp with weekly mock tests."
  }
];

export default function Home() {
  const [selectedClass, setSelectedClass] = useState(10);
  const navigate = useNavigate();
  const featuredRef = useRef(null);

  const scrollFeatured = (direction) => {
    if (!featuredRef.current) return;
    featuredRef.current.scrollBy({
      left: direction * 360,
      behavior: "smooth"
    });
  };

  return (
    <div className="container">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">CrestUp Education</p>
          <h1>Learn smarter with short, focused courses.</h1>
          <p className="muted">
            Build real skills, track progress, and stay motivated with a
            learning plan that fits your schedule.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" to="/courses">
              Browse courses
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <h3>Why CrestUp?</h3>
          <ul>
            <li>Curated content with clear outcomes</li>
            <li>Trackable progress per course</li>
            <li>Learn at your pace, on any device</li>
          </ul>
        </div>
      </section>

      <section className="featured-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>Top batches students love</h2>
            <p className="muted">
              Hand-picked crash courses and board mastery packs.
            </p>
          </div>
          <div className="featured-controls">
            <button
              className="featured-nav"
              type="button"
              onClick={() => scrollFeatured(-1)}
              aria-label="Scroll left"
            >
              &larr;
            </button>
            <button
              className="featured-nav"
              type="button"
              onClick={() => scrollFeatured(1)}
              aria-label="Scroll right"
            >
              &rarr;
            </button>
          </div>
        </div>
        <div className="featured-track" ref={featuredRef}>
          {FEATURED_COURSES.map((course) => (
            <article key={course.title} className="featured-card">
              <div
                className="featured-media"
                style={
                  course.image
                    ? { backgroundImage: `url(${course.image})` }
                    : undefined
                }
              >
                {!course.image ? (
                  <div className="featured-fallback">
                    <p>{course.subtitle}</p>
                  </div>
                ) : null}
                <span className="featured-tag">{course.classLevel}</span>
              </div>
              <div className="featured-body">
                <h3>{course.title}</h3>
                <p className="muted">{course.subtitle}</p>
                <p className="featured-teacher">{course.teacher}</p>
                <div className="featured-price">
                  <span className="featured-amount">&#8377;{course.price}</span>
                  <span className="featured-original">
                    &#8377;{course.originalPrice}
                  </span>
                  <span className="featured-discount">{course.discount}</span>
                </div>
                <Link
                  className="btn primary small"
                  to={`/courses?class=${course.classFilter}`}
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="featured-note muted">
          Tip: Add course images inside `frontend/public/featured` with the same
          filenames to show the banners.
        </p>
      </section>

      <section className="class-picker">
        <div className="section-head">
          <div>
            <p className="eyebrow">Choose your class</p>
            <h2>Classes 6 to 12</h2>
            <p className="muted">
              Pick your class to see courses, notes, and test prep.
            </p>
          </div>
          <Link className="btn ghost" to={`/courses?class=${selectedClass}`}>
            Explore Class {selectedClass}
          </Link>
        </div>
        <div className="class-grid">
          {CLASS_OPTIONS.map((grade) => (
            <button
              key={grade}
              type="button"
              className={`class-chip ${selectedClass === grade ? "active" : ""}`}
              onClick={() => {
                setSelectedClass(grade);
                navigate(`/courses?class=${grade}`);
              }}
            >
              Class {grade}
            </button>
          ))}
        </div>
      </section>

      <section className="batch-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Batches</p>
            <h2>Pick a structured learning path</h2>
            <p className="muted">
              Weekly routines, mentor guidance, and revision plans.
            </p>
          </div>
          <Link className="btn ghost" to="/courses">
            See all batches
          </Link>
        </div>
        <div className="batch-grid">
          {FEATURED_BATCHES.map((batch) => (
            <div key={batch.title} className="batch-card">
              <div className="batch-head">
                <span className="batch-pill">{batch.badge}</span>
                <span className="batch-level">{batch.level}</span>
              </div>
              <h3>{batch.title}</h3>
              <p className="muted">{batch.summary}</p>
              <div className="batch-meta">
                <span>{batch.lessons}</span>
                <span>{batch.schedule}</span>
              </div>
              <div className="batch-footer">
                <Link className="btn primary small" to="/courses">
                  Enroll now
                </Link>
                <span className="batch-note">Limited seats</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mentor-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Mentor lineup</p>
            <h2>Learn from expert teachers</h2>
            <p className="muted">
              Daily doubt solving, guided notes, and live class support.
            </p>
          </div>
          <Link className="btn ghost" to="/live">
            Meet mentors
          </Link>
        </div>
        <div className="mentor-grid">
          {MENTORS.map((mentor) => (
            <div key={mentor.name} className="mentor-card">
              <div className="mentor-photo">
                {mentor.photo ? (
                  <img src={mentor.photo} alt={mentor.name} />
                ) : (
                  <span>{mentor.name[0]}</span>
                )}
              </div>
              <div>
                <h3>{mentor.name}</h3>
                <p className="muted">{mentor.subject}</p>
                <p className="mentor-meta">{mentor.experience}</p>
              </div>
              <span className="mentor-tag">{mentor.tag}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="highlight-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Results spotlight</p>
            <h2>Learning that shows real progress</h2>
            <p className="muted">
              Track growth, build confidence, and keep momentum every week.
            </p>
          </div>
          <Link className="btn ghost" to="/dashboard">
            View dashboard
          </Link>
        </div>
        <div className="highlight-grid">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="highlight-card">
              <p className="highlight-value">{item.value}</p>
              <p className="highlight-label">{item.label}</p>
              <p className="muted">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <div className="section-head">
          <div>
            <p className="eyebrow">Study tools</p>
            <h2>Live classes, downloads, and chat</h2>
            <p className="muted">
              Join live sessions, grab resources, and ask doubts anytime.
            </p>
          </div>
        </div>
        <div className="action-grid">
          <Link to="/live" className="action-card">
            <span className="action-title">Live Classes</span>
            <p className="muted">Join scheduled sessions with experts.</p>
            <span className="action-link">Join live</span>
          </Link>
          <Link to="/downloads" className="action-card">
            <span className="action-title">Downloads</span>
            <p className="muted">Notes, worksheets, and practice papers.</p>
            <span className="action-link">View downloads</span>
          </Link>
          <Link to="/chat" className="action-card">
            <span className="action-title">Chat Support</span>
            <p className="muted">Message mentors and get quick help.</p>
            <span className="action-link">Start chat</span>
          </Link>
        </div>
      </section>

      <section className="about-section">
        <div className="about-card">
          <h2>ABOUT US</h2>
          <p className="muted">
            Invest Aaj For Kal is India&apos;s premier institution established
            with the sole aim to initiate, enable and empower individuals to
            grow up to be extraordinary professionals.
          </p>
        </div>
      </section>
    </div>
  );
}
