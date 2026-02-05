import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth } from "../firebase";

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

export default function CourseDetails() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function fetchCourse() {
      const ref = doc(db, "courses", id);
      const snap = await getDoc(ref);
      setCourse(snap.data());
    }
    fetchCourse();
  }, [id]);

  useEffect(() => {
    async function fetchPurchase() {
      const user = auth.currentUser;
      if (!user) {
        setPurchased(false);
        setChecking(false);
        return;
      }

      try {
        const purchaseId = `${user.uid}_${id}`;
        const purchaseRef = doc(db, "purchases", purchaseId);
        const purchaseSnap = await getDoc(purchaseRef);
        setPurchased(purchaseSnap.exists());
      } catch (err) {
        console.error(err);
      } finally {
        setChecking(false);
      }
    }

    fetchPurchase();
  }, [id]);

  if (!course) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  const priceInfo = getPriceInfo(course);
  const locked = !priceInfo.isFree && !purchased;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>{course.title}</h2>
          {course.description ? (
            <p className="muted">{course.description}</p>
          ) : null}
        </div>
        <span className="course-price">{priceInfo.label}</span>
      </div>

      {locked ? (
        <div className="panel">
          <p>This course is locked. Purchase to unlock the content.</p>
          <Link to={`/payment/${id}`} className="btn primary">
            Buy this course
          </Link>
        </div>
      ) : (
        <div className="video-frame">
          <iframe
            width="100%"
            height="400"
            src={course.videoUrl}
            title="Course Video"
            allowFullScreen
          ></iframe>
        </div>
      )}

      {checking ? null : null}
    </div>
  );
}
