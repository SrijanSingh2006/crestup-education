import { useMemo, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL || "";

const SUBJECTS = [
  "Maths",
  "Physics",
  "Chemistry",
  "Biology",
  "Science",
  "English",
  "Social Science",
  "Commerce"
];

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

const SUPPORT_TYPES = [
  { value: "doubt", label: "Ask a doubt" },
  { value: "issue", label: "Report app issue" }
];

const ISSUE_TYPES = ["Login", "Payments", "Video/Audio", "Assignments", "Other"];

const SUGGESTIONS = [
  "Class 10 Physics 2023",
  "Class 12 Biology 2022",
  "Class 9 Maths 2021",
  "Show all Class 10 papers"
];

const SUBJECT_KEYWORDS = {
  physics: "Physics",
  phy: "Physics",
  chemistry: "Chemistry",
  chem: "Chemistry",
  biology: "Biology",
  bio: "Biology",
  maths: "Maths",
  math: "Maths",
  mathematics: "Maths",
  science: "Science",
  english: "English",
  social: "Social Science",
  sst: "Social Science",
  commerce: "Commerce"
};

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

function parseClassFromText(text) {
  const match = text.match(/\b(class|cls|std)\s*(\d{1,2})\b/i);
  if (match && match[2]) {
    return normalizeClass(match[2]);
  }
  const fallback = text.match(/\b(6|7|8|9|10|11|12)(st|nd|rd|th)?\b/i);
  if (fallback && fallback[1]) {
    return normalizeClass(fallback[1]);
  }
  return null;
}

function parseYearFromText(text) {
  const match = text.match(/\b(20\d{2}|19\d{2})\b/);
  return match ? Number(match[1]) : null;
}

function parseSubjectFromText(text) {
  const lowered = text.toLowerCase();
  for (const keyword of Object.keys(SUBJECT_KEYWORDS)) {
    if (lowered.includes(keyword)) {
      return SUBJECT_KEYWORDS[keyword];
    }
  }
  return null;
}

function formatPaperTitle(paper) {
  const year = paper.year ? ` ${paper.year}` : "";
  const board = paper.board ? ` · ${paper.board}` : "";
  return `${paper.title || "Question Paper"}${year}${board}`;
}

async function fetchGeminiPapers({ query, classLevel, subject }) {
  const response = await fetch(`${API_BASE}/api/gemini/previous-papers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, classLevel, subject })
  });

  const data = await response.json();
  if (!response.ok) {
    const errorMessage = data?.error || "Unable to fetch papers.";
    throw new Error(errorMessage);
  }

  const papers = Array.isArray(data?.papers)
    ? data.papers
    : Array.isArray(data)
      ? data
      : [];

  return {
    papers,
    note: data?.note || data?.message || data?.text || ""
  };
}

export default function Chat() {
  const [mode, setMode] = useState("papers");
  const [supportType, setSupportType] = useState("doubt");
  const [issueType, setIssueType] = useState(ISSUE_TYPES[0]);
  const [paperInput, setPaperInput] = useState("");
  const [doubtInput, setDoubtInput] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [klass, setKlass] = useState(CLASSES[4]);
  const [paperLoading, setPaperLoading] = useState(false);

  const [paperMessages, setPaperMessages] = useState([
    {
      id: 1,
      sender: "mentor",
      text: "Ask for previous year question papers like \"Class 10 Physics 2023\"."
    }
  ]);

  const [supportMessages, setSupportMessages] = useState([
    {
      id: 1,
      sender: "mentor",
      text: "Share your doubt or app issue. Our team will assist you quickly."
    }
  ]);

  const defaultClass = useMemo(() => normalizeClass(klass), [klass]);

  const handlePaperSend = async (preset) => {
    const queryText = preset || paperInput.trim();
    if (!queryText) return;

    const newMessage = {
      id: Date.now(),
      sender: "student",
      text: queryText,
      meta: `Class ${defaultClass} · ${subject}`
    };

    setPaperMessages((prev) => [...prev, newMessage]);
    setPaperInput("");
    setPaperLoading(true);

    const queryClass = parseClassFromText(queryText) ?? defaultClass;
    const querySubject = parseSubjectFromText(queryText) ?? subject;
    const queryYear = parseYearFromText(queryText);

    try {
      const { papers, note } = await fetchGeminiPapers({
        query: queryText,
        classLevel: queryClass,
        subject: querySubject
      });

      const filtered = papers.filter((paper) => {
        const classMatch = queryClass
          ? normalizeClass(paper.class || paper.classLevel || paper.grade) ===
            queryClass
          : true;
        const subjectMatch = querySubject
          ? String(paper.subject || "")
              .toLowerCase()
              .includes(String(querySubject).toLowerCase())
          : true;
        const yearMatch = queryYear ? Number(paper.year) === queryYear : true;
        return classMatch && subjectMatch && yearMatch;
      });

      const top = filtered.slice(0, 6);
      if (top.length === 0) {
        setPaperMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "mentor",
            text:
              note ||
              "No papers found for that query. Try another year or subject."
          }
        ]);
      } else {
        setPaperMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: "mentor",
            text: `Here are ${top.length} papers for Class ${queryClass} · ${querySubject}:`,
            attachments: top.map((paper) => ({
              id: paper.id || `${paper.title}-${paper.year}`,
              title: formatPaperTitle(paper),
              url: paper.link || paper.url || paper.fileUrl,
              year: paper.year,
              board: paper.board
            }))
          }
        ]);
      }
    } catch (err) {
      setPaperMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "mentor",
          text: err.message || "Unable to load papers right now."
        }
      ]);
    } finally {
      setPaperLoading(false);
    }
  };

  const handleSupportSend = () => {
    const queryText = doubtInput.trim();
    if (!queryText) return;

    const meta =
      supportType === "doubt"
        ? `Doubt · Class ${defaultClass} · ${subject}`
        : `App issue · ${issueType}`;

    const newMessage = {
      id: Date.now(),
      sender: "student",
      text: queryText,
      meta
    };

    setSupportMessages((prev) => [...prev, newMessage]);
    setDoubtInput("");

    setSupportMessages((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        sender: "mentor",
        text:
          supportType === "doubt"
            ? "Thanks! A mentor will respond to your doubt soon."
            : "Thanks! Our support team will review the issue and respond soon."
      }
    ]);
  };

  const handlePaperKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handlePaperSend();
    }
  };

  const handleSupportKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSupportSend();
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Support Assistant</h2>
          <p className="muted">
            Ask doubts, report issues, or search previous year papers.
          </p>
        </div>
        <span className="page-pill">Powered by CrestUp</span>
      </div>

      <div className="chat-shell">
        <div className="chat-mode">
          <button
            className={`chat-mode-btn ${mode === "support" ? "active" : ""}`}
            type="button"
            onClick={() => setMode("support")}
          >
            Doubt & App Support
          </button>
          <button
            className={`chat-mode-btn ${mode === "papers" ? "active" : ""}`}
            type="button"
            onClick={() => setMode("papers")}
          >
            Previous Year Papers
          </button>
        </div>

        {mode === "support" ? (
          <>
            <div className="chat-header">
              <div>
                <h3>Support Desk</h3>
                <p className="muted">Choose doubt or app issue and type below.</p>
              </div>
              <span className="chat-status">Online</span>
            </div>

            <div className="chat-options">
              <label>
                <span>Support type</span>
                <select
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  className="chat-select"
                >
                  {SUPPORT_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {supportType === "doubt" ? (
                <>
                  <label>
                    <span>Class</span>
                    <select
                      value={klass}
                      onChange={(e) => setKlass(Number(e.target.value))}
                      className="chat-select"
                    >
                      {CLASSES.map((item) => (
                        <option key={item} value={item}>
                          Class {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Subject</span>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="chat-select"
                    >
                      {SUBJECTS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <label>
                  <span>Issue type</span>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="chat-select"
                  >
                    {ISSUE_TYPES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <div className="chat-stream">
              {supportMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.sender === "student" ? "outgoing" : ""}`}
                >
                  <span className="chat-bubble">{message.text}</span>
                  {message.meta ? (
                    <span className="chat-time">{message.meta}</span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder={
                  supportType === "doubt"
                    ? "Type your doubt here"
                    : "Describe the app issue"
                }
                value={doubtInput}
                onChange={(e) => setDoubtInput(e.target.value)}
                onKeyDown={handleSupportKeyDown}
              />
              <button
                className="btn primary small"
                type="button"
                onClick={handleSupportSend}
                disabled={!doubtInput.trim()}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="chat-header">
              <div>
                <h3>Previous Year Papers</h3>
                <p className="muted">Try: “Class 10 Physics 2023 paper”.</p>
              </div>
              <span className="chat-status">Ready</span>
            </div>

            <div className="chat-options">
              <label>
                <span>Class</span>
                <select
                  value={klass}
                  onChange={(e) => setKlass(Number(e.target.value))}
                  className="chat-select"
                >
                  {CLASSES.map((item) => (
                    <option key={item} value={item}>
                      Class {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Subject</span>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="chat-select"
                >
                  {SUBJECTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="chat-suggestions">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="chat-chip"
                  onClick={() => handlePaperSend(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="chat-stream">
              {paperMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-message ${message.sender === "student" ? "outgoing" : ""}`}
                >
                  <span className="chat-bubble">{message.text}</span>
                  {message.meta ? (
                    <span className="chat-time">{message.meta}</span>
                  ) : null}
                  {message.attachments ? (
                    <div className="chat-attachments">
                      {message.attachments.map((paper) => (
                        <a
                          key={paper.id}
                          href={paper.url}
                          target="_blank"
                          rel="noreferrer"
                          className="paper-card"
                        >
                          <div>
                            <h4>{paper.title}</h4>
                            <p className="muted">
                              {paper.year
                                ? `Year ${paper.year}`
                                : "Question Paper"}
                              {paper.board ? ` · ${paper.board}` : ""}
                            </p>
                          </div>
                          <span className="paper-link">Open PDF</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {paperLoading ? (
                <div className="chat-message">
                  <span className="chat-bubble">Searching papers...</span>
                </div>
              ) : null}
            </div>

            <div className="chat-input">
              <input
                type="text"
                placeholder="Type: Class 10 Physics 2023"
                value={paperInput}
                onChange={(e) => setPaperInput(e.target.value)}
                onKeyDown={handlePaperKeyDown}
              />
              <button
                className="btn primary small"
                type="button"
                onClick={() => handlePaperSend()}
                disabled={!paperInput.trim()}
              >
                Search
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
