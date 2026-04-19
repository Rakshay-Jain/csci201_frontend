import { useState } from "react";
import "./SocialPage.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudyPartner {
  id: number;
  name: string;
  initials: string;
  sharedCourses: string[];
  compatibilityScore: number;
  status: "online" | "offline" | "studying";
  avatarColor: string;
}

interface StudyRequest {
  id: number;
  fromName: string;
  fromInitials: string;
  sharedCourses: string[];
  sentAt: string;
  avatarColor: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PARTNERS: StudyPartner[] = [
  {
    id: 1,
    name: "Alex Chen",
    initials: "AC",
    sharedCourses: ["CSCI 201", "CSCI 270", "MATH 226"],
    compatibilityScore: 96,
    status: "studying",
    avatarColor: "#e74c3c",
  },
  {
    id: 2,
    name: "Priya Patel",
    initials: "PP",
    sharedCourses: ["CSCI 201", "CSCI 350"],
    compatibilityScore: 82,
    status: "online",
    avatarColor: "#e67e22",
  },
  {
    id: 3,
    name: "Jordan Kim",
    initials: "JK",
    sharedCourses: ["CSCI 201", "MATH 226", "EE 101"],
    compatibilityScore: 78,
    status: "offline",
    avatarColor: "#27ae60",
  },
  {
    id: 4,
    name: "Sam Rivera",
    initials: "SR",
    sharedCourses: ["CSCI 201", "CSCI 270"],
    compatibilityScore: 74,
    status: "online",
    avatarColor: "#8e44ad",
  },
  {
    id: 5,
    name: "Taylor Nguyen",
    initials: "TN",
    sharedCourses: ["CSCI 270", "MATH 226"],
    compatibilityScore: 61,
    status: "offline",
    avatarColor: "#2980b9",
  },
];

const MOCK_REQUESTS: StudyRequest[] = [
  {
    id: 1,
    fromName: "Marcus Lee",
    fromInitials: "ML",
    sharedCourses: ["CSCI 201", "CSCI 350"],
    sentAt: "2 min ago",
    avatarColor: "#16a085",
  },
  {
    id: 2,
    fromName: "Dana Wu",
    fromInitials: "DW",
    sharedCourses: ["MATH 226"],
    sentAt: "1 hr ago",
    avatarColor: "#c0392b",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: StudyPartner["status"] }) {
  return <span className={`status-dot status-${status}`} title={status} />;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? "#e74c3c" : score >= 75 ? "#e67e22" : "#f1c40f";
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

function PartnerCard({
  partner,
  onSendRequest,
  requestSent,
}: {
  partner: StudyPartner;
  onSendRequest: (id: number) => void;
  requestSent: boolean;
}) {
  return (
    <div className="partner-card">
      <div className="partner-card-top">
        <div
          className="avatar"
          style={{ background: partner.avatarColor }}
        >
          {partner.initials}
          <StatusDot status={partner.status} />
        </div>
        <div className="partner-info">
          <div className="partner-name">{partner.name}</div>
          <div className="partner-status-label">{partner.status}</div>
        </div>
        <div className="compatibility-badge">
          <span className="compat-number">{partner.compatibilityScore}</span>
          <span className="compat-label">match</span>
        </div>
      </div>

      <ScoreBar score={partner.compatibilityScore} />

      <div className="shared-courses-label">Shared courses</div>
      <div className="course-tags">
        {partner.sharedCourses.map((c) => (
          <span key={c} className="course-tag">
            {c}
          </span>
        ))}
      </div>

      <button
        className={`send-request-btn ${requestSent ? "sent" : ""}`}
        onClick={() => onSendRequest(partner.id)}
        disabled={requestSent}
      >
        {requestSent ? "✓ Request Sent" : "Send Study Request"}
      </button>
    </div>
  );
}

function IncomingRequestCard({
  request,
  onAccept,
  onDecline,
  resolved,
  resolution,
}: {
  request: StudyRequest;
  onAccept: (id: number) => void;
  onDecline: (id: number) => void;
  resolved: boolean;
  resolution: "accepted" | "declined" | null;
}) {
  return (
    <div className={`request-card ${resolved ? `resolved-${resolution}` : ""}`}>
      <div
        className="avatar avatar-sm"
        style={{ background: request.avatarColor }}
      >
        {request.fromInitials}
      </div>
      <div className="request-info">
        <div className="request-name">{request.fromName}</div>
        <div className="course-tags">
          {request.sharedCourses.map((c) => (
            <span key={c} className="course-tag course-tag-sm">
              {c}
            </span>
          ))}
        </div>
        <div className="request-time">{request.sentAt}</div>
      </div>
      {resolved ? (
        <div className={`resolution-label ${resolution}`}>
          {resolution === "accepted" ? "✓ Accepted" : "✗ Declined"}
        </div>
      ) : (
        <div className="request-actions">
          <button
            className="btn-accept"
            onClick={() => onAccept(request.id)}
          >
            Accept
          </button>
          <button
            className="btn-decline"
            onClick={() => onDecline(request.id)}
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SocialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
  const [resolvedRequests, setResolvedRequests] = useState<
    Map<number, "accepted" | "declined">
  >(new Map());

  const filteredPartners = MOCK_PARTNERS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sharedCourses.some((c) =>
        c.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleSendRequest = (id: number) => {
    setSentRequests((prev) => new Set(prev).add(id));
  };

  const handleAccept = (id: number) => {
    setResolvedRequests((prev) => new Map(prev).set(id, "accepted"));
  };

  const handleDecline = (id: number) => {
    setResolvedRequests((prev) => new Map(prev).set(id, "declined"));
  };

  return (
    <div className="social-page">
      {/* Header */}
      <div className="social-header">
        <div className="social-header-text">
          <h1 className="social-title">Study Partners</h1>
          <p className="social-subtitle">
            Find classmates who share your courses
          </p>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <span className="stat-num">{MOCK_PARTNERS.length}</span> matches
          </div>
          <div className="stat-chip stat-chip-alert">
            <span className="stat-num">{MOCK_REQUESTS.length}</span> requests
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-wrapper">
        <span className="search-icon">⌕</span>
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name or course (e.g. CSCI 201)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery("")}>
            ×
          </button>
        )}
      </div>

      <div className="social-layout">
        {/* Left: Recommended Partners */}
        <section className="partners-section">
          <h2 className="section-title">
            Recommended Partners
            {searchQuery && (
              <span className="filter-note">
                {" "}— {filteredPartners.length} result
                {filteredPartners.length !== 1 ? "s" : ""}
              </span>
            )}
          </h2>

          {filteredPartners.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div>No partners found for "{searchQuery}"</div>
            </div>
          ) : (
            <div className="partners-grid">
              {filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  partner={partner}
                  onSendRequest={handleSendRequest}
                  requestSent={sentRequests.has(partner.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Right: Incoming Requests */}
        <section className="requests-section">
          <h2 className="section-title">
            Incoming Requests
            {MOCK_REQUESTS.some((r) => !resolvedRequests.has(r.id)) && (
              <span className="badge-dot" />
            )}
          </h2>

          {MOCK_REQUESTS.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div>No pending requests</div>
            </div>
          ) : (
            <div className="requests-list">
              {MOCK_REQUESTS.map((req) => (
                <IncomingRequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  resolved={resolvedRequests.has(req.id)}
                  resolution={resolvedRequests.get(req.id) ?? null}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
