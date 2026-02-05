import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase";
import CorseCard from "../components/CorseCard";
import { Link, useSearchParams } from "react-router-dom";

const CLASS_OPTIONS = [6, 7, 8, 9, 10, 11, 12];

function normalizeClass(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(value);
  const match = text.match(/\d{1,2}/);
  if (match) {
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getCourseClass(course) {
  if (!course) return null;
  const candidates = [
    course.class,
    course.grade,
    course.level,
    course.Class,
    course.className,
    course.classLevel,
    course.gradeLevel,
    course.std,
    course.standard
  ];

  for (const value of candidates) {
    const parsed = normalizeClass(value);
    if (parsed) return parsed;
  }

  const keys = Object.keys(course);
  for (const key of keys) {
    const lowered = key.toLowerCase();
    if (
      lowered.includes("class") ||
      lowered.includes("grade") ||
      lowered.includes("std") ||
      lowered.includes("standard")
    ) {
      const parsed = normalizeClass(course[key]);
      if (parsed) return parsed;
    }
  }

  return null;
}

function matchesSubject(course, subject) {
  if (!subject) return true;
  const target = subject.toLowerCase();
  const fields = [
    course?.subject,
    course?.category,
    course?.title,
    course?.description
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return fields.some((value) => value.includes(target));
}

export default function Courses() {
  const [searchParams] = useSearchParams();
  const selectedClassParam = searchParams.get("class");
  const selectedSubject = searchParams.get("subject");
  const selectedClass = selectedClassParam
    ? Number(selectedClassParam)
    : null;
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [purchasedIds, setPurchasedIds] = useState(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const snap = await getDocs(collection(db, "courses"));
        const items = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(items);
      } catch (err) {
        setError(err.message || "Failed to load courses.");
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  useEffect(() => {
    async function fetchPurchases() {
      if (!user) {
        setPurchasedIds(new Set());
        return;
      }

      try {
        const purchaseQuery = query(
          collection(db, "purchases"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(purchaseQuery);
        const ids = new Set();
        snap.docs.forEach((doc) => {
          const data = doc.data();
          if (data?.courseId) ids.add(data.courseId);
        });
        setPurchasedIds(ids);
      } catch (err) {
        console.error(err);
      }
    }

    fetchPurchases();
  }, [user]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const courseClass = getCourseClass(course);
      const classMatch = selectedClass
        ? courseClass === selectedClass
        : true;
      return classMatch && matchesSubject(course, selectedSubject);
    });
  }, [courses, selectedClass, selectedSubject]);

  const groupedCourses = useMemo(() => {
    const groups = new Map();
    filteredCourses.forEach((course) => {
      const courseClass = getCourseClass(course);
      const key = courseClass ?? "Other";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(course);
    });
    return groups;
  }, [filteredCourses]);

  const orderedGroupKeys = useMemo(() => {
    if (selectedClass) {
      return groupedCourses.has(selectedClass)
        ? [selectedClass]
        : [];
    }
    const keys = [];
    CLASS_OPTIONS.forEach((value) => {
      if (groupedCourses.has(value)) keys.push(value);
    });
    if (groupedCourses.has("Other")) keys.push("Other");
    return keys;
  }, [groupedCourses, selectedClass]);

  if (loading) {
    return (
      <div className="container">
        <div className="page-header">
          <div>
            <h2>Courses</h2>
            <p className="muted">Short, focused lessons built for progress.</p>
          </div>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="page-header">
          <div>
            <h2>Courses</h2>
            <p className="muted">Short, focused lessons built for progress.</p>
          </div>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>
            {selectedClass ? `Class ${selectedClass} Courses` : "Courses"}
          </h2>
          <p className="muted">
            {selectedClass
              ? "Showing courses for your selected class."
              : "Short, focused lessons built for progress."}
          </p>
        </div>
        <span className="page-pill">{filteredCourses.length} available</span>
      </div>
      {selectedClass || selectedSubject ? (
        <div className="filter-row">
          {selectedClass ? (
            <Link className="filter-chip active" to="/courses">
              Clear class filter
            </Link>
          ) : null}
          {selectedSubject ? (
            <Link className="filter-chip active" to="/courses">
              Clear subject filter
            </Link>
          ) : null}
        </div>
      ) : null}

      {filteredCourses.length === 0 ? (
        <div className="panel">
          <p>No courses found for this selection.</p>
        </div>
      ) : (
        orderedGroupKeys.map((key) => {
          const items = groupedCourses.get(key) || [];
          const title =
            key === "Other" ? "Other courses" : `Class ${key}`;
          return (
            <section key={key} className="course-section">
              <div className="course-section-head">
                <h3 className="course-section-title">{title}</h3>
                <span className="course-section-meta">
                  {items.length} courses
                </span>
              </div>
              <div className="course-grid">
                {items.map((course) => (
                  <CorseCard
                    key={course.id}
                    course={course}
                    isPurchased={purchasedIds.has(course.id)}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
