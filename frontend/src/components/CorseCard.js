import { Link } from "react-router-dom";

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

function getPriceInfo(course) {
  const rawPrice =
    course?.price ??
    course?.fees ??
    course?.amount ??
    course?.cost ??
    null;

  if (rawPrice === 0 || rawPrice === "0" || rawPrice === "" || rawPrice == null) {
    return { label: "Free", isFree: true };
  }

  const numericPrice =
    typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  if (Number.isFinite(numericPrice)) {
    return { label: `\u20B9${numericPrice}`, isFree: false };
  }

  return { label: String(rawPrice), isFree: false };
}

export default function CorseCard({ course, isPurchased }) {
  const title = course?.title || "Untitled course";
  const description =
    course?.description || "Short, focused lessons to build confidence.";
  const classValue = getCourseClass(course);
  const grade =
    classValue ? `Class ${classValue}` : course?.grade || course?.class || course?.level || "Class 10";
  const subject = course?.subject || course?.category || "Core";
  const duration = course?.duration || course?.weeks || "6 weeks";
  const priceInfo = getPriceInfo(course);
  const canStart = isPurchased || priceInfo.isFree;

  return (
    <div className="course-card">
      <div className="course-kicker">
        <span className="course-badge">{grade}</span>
        <span className="course-badge subtle">{subject}</span>
      </div>
      <h3 className="course-title">{title}</h3>
      <p className="course-desc">{description}</p>
      <div className="course-meta">
        <span>Duration: {duration}</span>
        <span>Mode: Online</span>
        <span className="course-price">{priceInfo.label}</span>
      </div>
      <div className="course-actions">
        <Link to={`/courses/${course.id}`} className="btn ghost small">
          View details
        </Link>
        {canStart ? (
          <Link to={`/courses/${course.id}`} className="btn primary small">
            Start learning
          </Link>
        ) : (
          <Link to={`/payment/${course.id}`} className="btn primary small">
            Buy course
          </Link>
        )}
      </div>
    </div>
  );
}
