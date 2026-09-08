import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Heart,
  CarFront,
  LayoutDashboard,
  Users,
  CalendarDays,
  Settings,
  LogOut,
  MessageCircle,
  X,
  Plus,
  Check,
  ChevronRight,
  RefreshCw,
  Download,
  ShieldCheck,
  Send,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { api, setToken } from "../lib/api";
import { toast, Toaster } from "sonner";
const price = (v, currency = "CAD") =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
const statusClass = (s) =>
  ["confirmed", "won", "completed"].includes(s)
    ? "success"
    : ["cancelled", "closed"].includes(s)
      ? "muted"
      : "pending";
const blankVehicle = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  price: "",
  mileage: 0,
  bodyType: "SUV",
  fuelType: "Gasoline",
  description: "",
  imageUrl: "",
  inStock: true,
};
function Field({ label: caption, children, ...props }) {
  return (
    <label className="field">
      <span>{caption}</span>
      {children || <Input {...props} />}
    </label>
  );
}
function Empty({ title, description, children }) {
  return (
    <div className="empty">
      <CarFront size={32} />
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
function Photo({ vehicle }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [vehicle.imageUrl]);
  return (
    <div className="car-photo">
      {vehicle.imageUrl && !failed ? (
        <img
          src={vehicle.imageUrl}
          alt={`${vehicle.make} ${vehicle.model}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo-placeholder">
          <CarFront size={54} strokeWidth={1} />
          <span>
            {vehicle.make} / {vehicle.bodyType}
          </span>
        </div>
      )}
      {vehicle.demo && <span className="photo-label">Sample vehicle</span>}
      <span className="fuel">{vehicle.fuelType}</span>
    </div>
  );
}
export default function Workspace() {
  const [cfg, setCfg] = useState(null),
    [vehicles, setVehicles] = useState([]),
    [view, setView] = useState("shop"),
    [active, setActive] = useState("overview"),
    [auth, setAuth] = useState(false),
    [login, setLogin] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [data, setData] = useState(null);
  const [query, setQuery] = useState(""),
    [type, setType] = useState("All vehicles"),
    [budget, setBudget] = useState(""),
    [sort, setSort] = useState("featured"),
    [saved, setSaved] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("northstar-shortlist") || "[]");
      } catch {
        return [];
      }
    }),
    [onlySaved, setOnlySaved] = useState(false);
  const [selected, setSelected] = useState(null),
    [booking, setBooking] = useState(null),
    [receipt, setReceipt] = useState(null),
    [tracking, setTracking] = useState(false),
    [trackCode, setTrackCode] = useState(""),
    [trackResult, setTrackResult] = useState(null),
    [privacy, setPrivacy] = useState(false),
    [chat, setChat] = useState(false),
    [messages, setMessages] = useState([]),
    [chatInput, setChatInput] = useState("");
  const [editVehicle, setEditVehicle] = useState(null),
    [editLead, setEditLead] = useState(null),
    [leadQuery, setLeadQuery] = useState(""),
    [leadStatus, setLeadStatus] = useState("all"),
    [offline, setOffline] = useState(!navigator.onLine);
  const load = useCallback(async () => {
    try {
      const [config, inventory, session] = await Promise.all([
        api("/config"),
        api("/inventory"),
        api("/auth/session"),
      ]);
      setCfg(config);
      setVehicles(inventory.vehicles);
      setAuth(session.authenticated);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  const loadAdmin = useCallback(async () => {
    try {
      const result = await api("/admin/overview");
      setData(result);
    } catch (e) {
      toast.error(e.message);
      if (e.status === 401) {
        setAuth(false);
        setLogin(true);
      }
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (view === "staff" && auth) loadAdmin();
  }, [view, auth, loadAdmin]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    localStorage.setItem("northstar-shortlist", JSON.stringify(saved));
  }, [saved]);
  const toggleSaved = (id) =>
    setSaved((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const mutate = async (path, body, method = "PATCH") => {
    await api(path, { method, body });
    await loadAdmin();
    await load();
    toast.success("Saved successfully");
  };
  const filtered = vehicles
    .filter(
      (v) =>
        v.inStock &&
        (!onlySaved || saved.includes(v.id)) &&
        (type === "All vehicles" || v.bodyType === type) &&
        (!budget || v.price <= Number(budget)) &&
        `${v.make} ${v.model} ${v.fuelType}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : b.year - a.year,
    );
  const navStaff = () => {
    if (auth) setView("staff");
    else setLogin(true);
  };
  async function sendChat(message = chatInput) {
    if (!message.trim() || busy) return;
    setChatInput("");
    setMessages((old) => [...old, { role: "user", text: message }]);
    await run(async () => {
      try {
        const result = await api("/chat", {
          method: "POST",
          body: { message },
        });
        setMessages((old) => [
          ...old,
          { role: "assistant", text: result.reply, mode: result.mode },
        ]);
      } catch (e) {
        setMessages((old) => [
          ...old,
          {
            role: "assistant",
            text: "I couldn’t connect. Please try again, or use the inquiry form.",
          },
        ]);
        throw e;
      }
    });
  }
  if (loading)
    return (
      <div className="boot">
        <div className="brand-mark">
          N<span>↗</span>
        </div>
        <p>Opening your showroom…</p>
      </div>
    );
  if (error && !cfg)
    return (
      <div className="boot">
        <h1>We couldn’t connect</h1>
        <p role="alert">{error}</p>
        <Button onClick={load}>Try again</Button>
      </div>
    );
  const leads = (data?.leads || []).filter(
    (l) =>
      (leadStatus === "all" || l.status === leadStatus) &&
      `${l.name} ${l.email} ${l.vehicleName || ""}`
        .toLowerCase()
        .includes(leadQuery.toLowerCase()),
  );
  return (
    <div className="northstar">
      <Toaster richColors position="top-center" />
      {offline && (
        <div className="notice" role="status">
          You’re offline. Reconnect to view current inventory or send requests.
        </div>
      )}
      <header className="topbar">
        <button className="brand" onClick={() => setView("shop")}>
          <span className="brand-mark">
            N<span>↗</span>
          </span>
          <span>
            {cfg?.name || "Northstar Auto"}
            <small>A better way to drive.</small>
          </span>
        </button>
        <nav>
          <button
            className={view === "shop" && !onlySaved ? "nav-active" : ""}
            onClick={() => {
              setView("shop");
              setOnlySaved(false);
            }}
          >
            Explore cars
          </button>
          <button
            onClick={() => {
              setTrackResult(null);
              setTracking(true);
            }}
          >
            My request
          </button>
          <button
            onClick={() => {
              setView("shop");
              setOnlySaved(true);
            }}
          >
            <Heart size={17} /> Shortlist{" "}
            <span className="count">{saved.length}</span>
          </button>
        </nav>
        <button
          className="staff-button"
          aria-label="Staff workspace"
          onClick={navStaff}
        >
          <ShieldCheck size={16} />
          <span>Staff workspace</span>
          <ArrowUpRight size={16} />
        </button>
      </header>
      {cfg?.demo && (
        <div className="demo-strip">
          Preview showroom · Sample listings are for demonstration. No real
          vehicles or bookings are represented.
        </div>
      )}
      {view === "shop" ? (
        <main className="shop-main">
          <section className="intro">
            <div>
              <p className="eyebrow">
                <span /> THE NEXT CHAPTER STARTS HERE
              </p>
              <h1>
                Find your kind
                <br />
                of <em>freedom.</em>
              </h1>
              <p className="intro-copy">
                Explore the inventory. Ask the questions.
                <br />
                Make your next move with confidence.
              </p>
              <div className="intro-actions">
                <button
                  className="primary"
                  onClick={() =>
                    document
                      .getElementById("inventory")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore the collection <ArrowRight size={18} />
                </button>
                <button className="text-button" onClick={() => setChat(true)}>
                  Ask our assistant <MessageCircle size={18} />
                </button>
              </div>
            </div>
            <div className="feature-story">
              <div className="story-top">
                <span>YOUR NEXT DRIVE</span>
                <ArrowUpRight />
              </div>
              <div className="story-photo">
                {vehicles.find((v) => v.imageUrl)?.imageUrl ? (
                  <img
                    src={vehicles.find((v) => v.imageUrl).imageUrl}
                    alt="Illustrative vehicle from the sample collection"
                  />
                ) : (
                  <>
                    <CarFront size={110} strokeWidth={0.75} />
                    <span>The collection is taking shape.</span>
                  </>
                )}
              </div>
              <div className="story-bottom">
                <span>Consider every possibility.</span>
                <span>
                  {String(vehicles.filter((v) => v.inStock).length).padStart(
                    2,
                    "0",
                  )}{" "}
                  VEHICLES
                </span>
              </div>
            </div>
          </section>
          <section id="inventory" className="inventory">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE COLLECTION</p>
                <h2>
                  {onlySaved ? "Your shortlist" : "A good place to start."}
                </h2>
              </div>
              <span className="result-count">
                {filtered.length} vehicles to explore
              </span>
            </div>
            <div className="filters">
              <div className="search">
                <Search size={18} />
                <input
                  aria-label="Search inventory"
                  placeholder="Search make, model, or fuel…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <select
                aria-label="Maximum price"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="">Any budget</option>
                <option value="30000">
                  Under {price(30000, cfg.currency)}
                </option>
                <option value="40000">
                  Under {price(40000, cfg.currency)}
                </option>
                <option value="50000">
                  Under {price(50000, cfg.currency)}
                </option>
              </select>
              <select
                aria-label="Sort inventory"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Newest model year</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </div>
            <div className="type-tabs">
              {[
                "All vehicles",
                "SUV",
                "Sedan",
                "Truck",
                "Hatchback",
                "Coupe",
              ].map((t) => (
                <button
                  key={t}
                  className={type === t ? "selected" : ""}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
              {onlySaved && (
                <button onClick={() => setOnlySaved(false)}>
                  Show all cars <X size={14} />
                </button>
              )}
            </div>
            {filtered.length ? (
              <div className="car-grid">
                {filtered.map((v) => (
                  <article className="car-card" key={v.id}>
                    <button
                      className="photo-button"
                      onClick={() => setSelected(v)}
                      aria-label={`View ${v.make} ${v.model}`}
                    >
                      <Photo vehicle={v} />
                    </button>
                    <button
                      className={`save ${saved.includes(v.id) ? "is-saved" : ""}`}
                      aria-label={`${saved.includes(v.id) ? "Remove" : "Save"} ${v.make} ${v.model}`}
                      aria-pressed={saved.includes(v.id)}
                      onClick={() => toggleSaved(v.id)}
                    >
                      <Heart
                        size={19}
                        fill={saved.includes(v.id) ? "currentColor" : "none"}
                      />
                    </button>
                    <div className="car-body">
                      <p className="car-meta">
                        {v.year} <span>•</span> {v.bodyType} <span>•</span>{" "}
                        {v.mileage.toLocaleString()} km
                      </p>
                      <h3>
                        {v.make} {v.model}
                      </h3>
                      <div className="car-bottom">
                        <div>
                          <strong>{price(v.price, cfg.currency)}</strong>
                          <small>{cfg.currency} · Before taxes & fees</small>
                        </div>
                        <button
                          className="circle-button"
                          aria-label={`View details for ${v.make} ${v.model}`}
                          onClick={() => setSelected(v)}
                        >
                          <ArrowUpRight size={21} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title={
                  onlySaved
                    ? "Nothing on your shortlist yet"
                    : "No matches just yet"
                }
                description="Try a different search or clear your filters."
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setType("All vehicles");
                    setBudget("");
                    setOnlySaved(false);
                  }}
                >
                  Clear filters
                </Button>
              </Empty>
            )}
          </section>
          <section className="help-band">
            <div>
              <p className="eyebrow">LET’S TALK IT THROUGH</p>
              <h2>A little guidance goes a long way.</h2>
              <p>
                Ask about inventory, compare your options, or leave a request
                for our team.
              </p>
            </div>
            <button className="primary" onClick={() => setBooking({})}>
              Contact the team <ArrowUpRight size={18} />
            </button>
          </section>
          <footer>
            <span>
              © {new Date().getFullYear()} {cfg.name}
            </span>
            <span>{cfg.hours}</span>
            <button onClick={() => setPrivacy(true)}>Privacy & data</button>
            {cfg.phone && <a href={`tel:${cfg.phone}`}>{cfg.phone}</a>}
          </footer>
        </main>
      ) : (
        <div className="staff-layout">
          <aside className="sidebar">
            <p className="eyebrow">WORKSPACE</p>
            {[
              ["overview", LayoutDashboard, "Overview"],
              ["leads", Users, "Leads"],
              ["appointments", CalendarDays, "Test drives"],
              ["inventory", CarFront, "Inventory"],
              ["settings", Settings, "Settings"],
            ].map(([key, Icon, title]) => (
              <button
                key={key}
                className={active === key ? "selected" : ""}
                onClick={() => setActive(key)}
              >
                <Icon size={19} />
                {title}
                {key === "leads" && (
                  <span>
                    {data?.leads.filter((l) => l.status === "new").length || 0}
                  </span>
                )}
              </button>
            ))}
            <div className="sidebar-bottom">
              <span>
                <span className="live-dot" /> Staff access protected
              </span>
              <button
                onClick={() =>
                  run(async () => {
                    await api("/auth/logout", { method: "POST" });
                    setToken("");
                    setAuth(false);
                    setData(null);
                    setView("shop");
                  })
                }
              >
                <LogOut size={18} /> Sign out
              </button>
            </div>
          </aside>
          <main className="workspace">
            <div className="workspace-heading">
              <div>
                <p className="eyebrow">{cfg.name} / OPERATIONS</p>
                <h1>
                  {
                    {
                      overview: "Your day, in focus.",
                      leads: "Every lead matters.",
                      appointments: "The next test drive.",
                      inventory: "Your showroom.",
                      settings: "Make it yours.",
                    }[active]
                  }
                </h1>
              </div>
              <button
                className="outlined"
                onClick={() => run(loadAdmin)}
                disabled={busy}
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            {!data ? (
              <Empty
                title="Loading workspace"
                description="Retrieving your dealership’s records."
              />
            ) : (
              <>
                {active === "overview" && (
                  <>
                    <div className="metrics">
                      {[
                        [
                          "New leads",
                          data.leads.filter((l) => l.status === "new").length,
                          Users,
                        ],
                        [
                          "Awaiting confirmation",
                          data.appointments.filter(
                            (a) => a.status === "requested",
                          ).length,
                          CalendarDays,
                        ],
                        [
                          "Available vehicles",
                          data.vehicles.filter((v) => v.inStock).length,
                          CarFront,
                        ],
                        [
                          "Won leads",
                          data.leads.filter((l) => l.status === "won").length,
                          Check,
                        ],
                      ].map(([title, value, Icon]) => (
                        <div key={title}>
                          <span>
                            {title}
                            <Icon size={18} />
                          </span>
                          <strong>{value}</strong>
                          <small>From your saved records</small>
                        </div>
                      ))}
                    </div>
                    <div className="workspace-columns">
                      <section className="panel">
                        <div className="panel-heading">
                          <h2>Recent inquiries</h2>
                          <button onClick={() => setActive("leads")}>
                            View all <ArrowUpRight size={17} />
                          </button>
                        </div>
                        {data.leads.length ? (
                          data.leads.slice(0, 5).map((l) => (
                            <button
                              className="inquiry-row"
                              key={l.id}
                              onClick={() => setEditLead(l)}
                            >
                              <span className="avatar">
                                {l.name[0].toUpperCase()}
                              </span>
                              <span>
                                <strong>{l.name}</strong>
                                <small>
                                  {l.vehicleName || "General inquiry"}
                                </small>
                              </span>
                              <span
                                className={`badge ${statusClass(l.status)}`}
                              >
                                {l.status}
                              </span>
                              <ChevronRight size={16} />
                            </button>
                          ))
                        ) : (
                          <Empty
                            title="Your next conversation starts here"
                            description="New shopper inquiries will appear in this workspace."
                          />
                        )}
                      </section>
                      <section className="panel assistant-status">
                        <MessageCircle size={28} />
                        <p className="eyebrow">SHOPPER ASSISTANT</p>
                        <h2>
                          {cfg.aiMode === "live"
                            ? "Ready to help, around the clock."
                            : "Helpful answers. Grounded in inventory."}
                        </h2>
                        <p>
                          {cfg.aiMode === "live"
                            ? "Live AI is configured. Shoppers can ask questions about your inventory."
                            : "Guided answers are active. Connect your OpenAI service to enable live AI conversations."}
                        </p>
                        <button
                          className="outlined"
                          onClick={() => setChat(true)}
                        >
                          Try the assistant <ArrowUpRight size={17} />
                        </button>
                      </section>
                    </div>
                  </>
                )}
                {active === "leads" && (
                  <section className="panel">
                    <div className="table-tools">
                      <div className="search">
                        <Search size={17} />
                        <input
                          aria-label="Search leads"
                          placeholder="Search name, email, or vehicle"
                          value={leadQuery}
                          onChange={(e) => setLeadQuery(e.target.value)}
                        />
                      </div>
                      <select
                        aria-label="Filter lead status"
                        value={leadStatus}
                        onChange={(e) => setLeadStatus(e.target.value)}
                      >
                        {[
                          "all",
                          "new",
                          "contacted",
                          "qualified",
                          "won",
                          "closed",
                        ].map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        className="outlined"
                        onClick={() => {
                          const rows = [
                            ["Name", "Email", "Phone", "Vehicle", "Status"],
                            ...leads.map((l) => [
                              l.name,
                              l.email,
                              l.phone,
                              l.vehicleName,
                              l.status,
                            ]),
                          ];
                          const csv = rows
                            .map((r) =>
                              r
                                .map(
                                  (v) =>
                                    '"' +
                                    String(v || "")
                                      .replace(/^[=+@-]/, "'$&")
                                      .replaceAll('"', '""') +
                                    '"',
                                )
                                .join(","),
                            )
                            .join("\r\n");
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(
                            new Blob([csv], { type: "text/csv" }),
                          );
                          a.download = "northstar-leads.csv";
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(a.href), 1000);
                        }}
                      >
                        <Download size={16} /> Export
                      </button>
                    </div>
                    {leads.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Customer</th>
                              <th>Interested in</th>
                              <th>Received</th>
                              <th>Status</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map((l) => (
                              <tr key={l.id}>
                                <td>
                                  <strong>{l.name}</strong>
                                  <small>{l.email}</small>
                                </td>
                                <td>{l.vehicleName || "General inquiry"}</td>
                                <td>
                                  {new Date(l.createdAt).toLocaleDateString()}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${statusClass(l.status)}`}
                                  >
                                    {l.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="outlined"
                                    onClick={() => setEditLead(l)}
                                  >
                                    Open <ArrowUpRight size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty
                        title="No leads found"
                        description="Shopper inquiries appear here as soon as they are submitted."
                      />
                    )}
                  </section>
                )}
                {active === "appointments" && (
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>Test-drive requests</h2>
                      <span>Times shown in your device’s timezone</span>
                    </div>
                    {data.appointments.length ? (
                      data.appointments.map((a) => (
                        <div className="appointment-row" key={a.id}>
                          <div className="date-tile">
                            <small>
                              {new Date(a.scheduledFor).toLocaleDateString(
                                undefined,
                                { month: "short" },
                              )}
                            </small>
                            <strong>
                              {new Date(a.scheduledFor).getDate()}
                            </strong>
                          </div>
                          <div>
                            <strong>{a.name}</strong>
                            <p>{a.vehicleName}</p>
                            <small>
                              {new Date(a.scheduledFor).toLocaleString()}
                            </small>
                          </div>
                          <span className={`badge ${statusClass(a.status)}`}>
                            {a.status}
                          </span>
                          <div className="row-actions">
                            {(a.status === "requested"
                              ? ["confirmed", "cancelled"]
                              : a.status === "confirmed"
                                ? ["completed", "cancelled"]
                                : []
                            ).map((s) => (
                              <button
                                key={s}
                                className={
                                  s === "cancelled" ? "outlined" : "primary"
                                }
                                disabled={busy}
                                onClick={() =>
                                  run(() =>
                                    mutate("/admin/appointments/" + a.id, {
                                      status: s,
                                    }),
                                  )
                                }
                              >
                                {s === "confirmed"
                                  ? "Confirm"
                                  : s === "completed"
                                    ? "Complete"
                                    : "Cancel"}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty
                        title="Room for the next drive"
                        description="Requests from the shopper booking form will appear here for confirmation."
                      />
                    )}
                  </section>
                )}
                {active === "inventory" && (
                  <section className="panel">
                    <div className="panel-heading">
                      <h2>{data.vehicles.length} vehicles</h2>
                      <div className="row-actions">
                        {cfg.demo && (
                          <button
                            className="outlined"
                            disabled={busy}
                            onClick={() =>
                              run(() => mutate("/admin/seed", {}, "POST"))
                            }
                          >
                            Load sample vehicles
                          </button>
                        )}
                        <button
                          className="primary"
                          onClick={() => setEditVehicle({ ...blankVehicle })}
                        >
                          <Plus size={17} /> Add vehicle
                        </button>
                      </div>
                    </div>
                    {data.vehicles.length ? (
                      <div className="table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>Vehicle</th>
                              <th>Price</th>
                              <th>Availability</th>
                              <th>Manage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.vehicles.map((v) => (
                              <tr key={v.id}>
                                <td>
                                  <strong>
                                    {v.year} {v.make} {v.model}
                                  </strong>
                                  <small>
                                    {v.fuelType} ·{" "}
                                    {v.demo
                                      ? "Sample listing"
                                      : "Dealership listing"}
                                  </small>
                                </td>
                                <td>{price(v.price, cfg.currency)}</td>
                                <td>
                                  <span
                                    className={`badge ${v.inStock ? "success" : "muted"}`}
                                  >
                                    {v.inStock ? "Available" : "Unavailable"}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="outlined"
                                    onClick={() => setEditVehicle(v)}
                                  >
                                    Edit <ArrowUpRight size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty
                        title="Build your collection"
                        description="Add a real vehicle or load clearly labeled sample inventory to explore the app."
                      />
                    )}
                  </section>
                )}
                {active === "settings" && (
                  <form
                    className="panel settings-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const f = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      f.demo = f.demo === "on";
                      run(() => mutate("/admin/settings", f));
                    }}
                  >
                    <h2>Dealership details</h2>
                    <div className="form-grid">
                      {[
                        ["name", "Dealership name"],
                        ["phone", "Phone"],
                        ["address", "Address"],
                        ["supportEmail", "Privacy / support email"],
                        ["hours", "Sales hours"],
                      ].map(([key, title]) => (
                        <Field
                          key={key}
                          label={title}
                          name={key}
                          required={key === "name"}
                          type={key === "supportEmail" ? "email" : "text"}
                          defaultValue={data.settings[key]}
                          maxLength={300}
                        />
                      ))}
                      <Field label="Currency">
                        <select
                          name="currency"
                          defaultValue={data.settings.currency}
                        >
                          {["CAD", "USD", "GBP", "EUR", "INR"].map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <label className="check-field">
                      <input
                        name="demo"
                        type="checkbox"
                        defaultChecked={data.settings.demo}
                      />{" "}
                      Show preview banner and allow sample inventory
                    </label>
                    <p className="subtle">
                      Mark sample vehicles unavailable before opening your real
                      showroom. AI and phone service credentials are configured
                      securely on the server.
                    </p>
                    <Button disabled={busy}>Save settings</Button>
                  </form>
                )}
              </>
            )}
          </main>
        </div>
      )}
      <button
        className="chat-launcher"
        onClick={() => setChat(!chat)}
        aria-label="Open shopper assistant"
      >
        <MessageCircle size={21} />
        <span>Ask Northstar</span>
      </button>
      <Dialog open={login} onOpenChange={setLogin}>
        <DialogContent className="ns-dialog compact">
          <DialogHeader>
            <DialogTitle>Welcome back.</DialogTitle>
            <DialogDescription>
              Sign in to your dealership workspace.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.currentTarget));
              run(async () => {
                const result = await api("/auth/login", {
                  method: "POST",
                  body,
                });
                setToken(result.token);
                setAuth(true);
                setLogin(false);
                setView("staff");
              });
            }}
          >
            <Field
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
            <Field
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"} <ArrowRight size={17} />
            </Button>
            {!cfg.staffConfigured && (
              <p className="subtle">
                The owner needs to configure staff access before sign-in is
                available.
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="ns-dialog vehicle-dialog">
          <DialogHeader>
            <DialogTitle>
              {selected?.year} {selected?.make} {selected?.model}
            </DialogTitle>
            <DialogDescription>
              Vehicle details and test-drive requests.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <Photo vehicle={selected} />
              <div className="detail-price">
                <strong>{price(selected.price, cfg.currency)}</strong>
                <span>{cfg.currency} · Before taxes & fees</span>
              </div>
              <div className="specs">
                <span>{selected.bodyType}</span>
                <span>{selected.fuelType}</span>
                <span>{selected.mileage.toLocaleString()} km</span>
              </div>
              <p>
                {selected.description ||
                  "Contact the dealership for more details about this vehicle."}
              </p>
              <Estimator vehicle={selected} currency={cfg.currency} />
              <Button
                onClick={() => {
                  setBooking(selected);
                  setSelected(null);
                }}
              >
                Request a test drive <ArrowRight size={17} />
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!booking}
        onOpenChange={(open) => !open && setBooking(null)}
      >
        <DialogContent className="ns-dialog">
          <DialogHeader>
            <DialogTitle>
              {booking?.id
                ? "Let’s get you behind the wheel."
                : "Start a conversation."}
            </DialogTitle>
            <DialogDescription>
              {booking?.id
                ? `${booking.year} ${booking.make} ${booking.model} · Staff will confirm your request.`
                : "Leave your details and a message for the dealership."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              const body = {
                ...f,
                consent: f.consent === "on",
                vehicleId: booking.id,
                ...(f.scheduledFor
                  ? { scheduledFor: new Date(f.scheduledFor).toISOString() }
                  : {}),
              };
              run(async () => {
                const result = await api("/inquiries", {
                  method: "POST",
                  body,
                });
                setReceipt(result);
                setBooking(null);
              });
            }}
          >
            <div className="form-grid">
              <Field
                label="Your name"
                name="name"
                autoComplete="name"
                required
                maxLength={100}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
              />
              <Field
                label="Phone (optional)"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
              />
              {booking?.id && (
                <Field
                  label="Preferred date and time"
                  name="scheduledFor"
                  type="datetime-local"
                  step="1800"
                  required
                />
              )}
            </div>
            {booking?.id && (
              <p className="subtle">
                Choose a time on the hour or half hour, within 90 days. Times
                use your device’s timezone. Requests are subject to dealership
                hours and confirmation.
              </p>
            )}
            <Field label="Your message">
              <Textarea
                name="message"
                required
                maxLength={2000}
                defaultValue={
                  booking?.id
                    ? `I’d like to test drive the ${booking.make} ${booking.model}.`
                    : ""
                }
              />
            </Field>
            <label className="check-field">
              <input type="checkbox" name="consent" /> I agree to optional
              follow-up calls or texts about this inquiry.
            </label>
            <p className="subtle">
              Your details are shared with dealership staff to respond to your
              request.{" "}
              <button type="button" onClick={() => setPrivacy(true)}>
                Read privacy details
              </button>
              .
            </p>
            <Button disabled={busy} type="submit">
              {busy ? "Sending…" : "Send request"} <ArrowRight size={17} />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!receipt}
        onOpenChange={(open) => !open && setReceipt(null)}
      >
        <DialogContent className="ns-dialog compact">
          <DialogHeader>
            <DialogTitle>Request received.</DialogTitle>
            <DialogDescription>
              Your details have been saved. Your test drive is not confirmed
              yet.
            </DialogDescription>
          </DialogHeader>
          <p>
            Keep this private request code. Use “My request” to check its status
            or delete your information.
          </p>
          <code className="request-code">{receipt?.trackingToken}</code>
          <Button
            onClick={() =>
              run(async () => {
                await navigator.clipboard.writeText(receipt.trackingToken);
                toast.success("Request code copied");
              })
            }
          >
            Copy request code
          </Button>
        </DialogContent>
      </Dialog>
      <Dialog open={tracking} onOpenChange={setTracking}>
        <DialogContent className="ns-dialog compact">
          <DialogHeader>
            <DialogTitle>Your request.</DialogTitle>
            <DialogDescription>
              Enter the private code shown when you submitted your inquiry.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () =>
                setTrackResult(
                  await api("/request/status", {
                    method: "POST",
                    body: { token: trackCode },
                  }),
                ),
              );
            }}
          >
            <Field
              label="Request code"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              required
            />
            <Button disabled={busy}>Check status</Button>
          </form>
          {trackResult && (
            <div className="tracking-result">
              <span className="badge">{trackResult.status}</span>
              <h3>{trackResult.vehicleName || "General inquiry"}</h3>
              {trackResult.appointments.map((a) => (
                <p key={a.id}>
                  {new Date(a.scheduledFor).toLocaleString()} — {a.status}
                </p>
              ))}
              <button
                className="danger"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Delete this inquiry and its appointments permanently?",
                    )
                  )
                    run(async () => {
                      await api("/request/delete", {
                        method: "POST",
                        body: { token: trackCode },
                      });
                      setTrackResult(null);
                      setTrackCode("");
                      toast.success(
                        "Your request and personal details were deleted",
                      );
                    });
                }}
              >
                Delete my request and personal details
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editVehicle}
        onOpenChange={(open) => !open && setEditVehicle(null)}
      >
        <DialogContent className="ns-dialog">
          <DialogHeader>
            <DialogTitle>
              {editVehicle?.id ? "Edit vehicle" : "Add a vehicle"}
            </DialogTitle>
            <DialogDescription>
              Publish accurate specifications and an image you have permission
              to use.
            </DialogDescription>
          </DialogHeader>
          {editVehicle && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                f.inStock = f.inStock === "on";
                f.demo = editVehicle.demo === true;
                run(async () => {
                  await mutate(
                    "/admin/inventory" +
                      (editVehicle.id ? "/" + editVehicle.id : ""),
                    f,
                    editVehicle.id ? "PATCH" : "POST",
                  );
                  setEditVehicle(null);
                });
              }}
            >
              <div className="form-grid">
                {[
                  ["make", "Make"],
                  ["model", "Model"],
                  ["year", "Year"],
                  ["price", "Price"],
                  ["mileage", "Mileage (km)"],
                ].map(([key, title]) => (
                  <Field
                    key={key}
                    name={key}
                    label={title}
                    type={
                      ["year", "price", "mileage"].includes(key)
                        ? "number"
                        : "text"
                    }
                    defaultValue={editVehicle[key]}
                    required
                  />
                ))}
                <Field label="Body type">
                  <select name="bodyType" defaultValue={editVehicle.bodyType}>
                    {[
                      "SUV",
                      "Sedan",
                      "Truck",
                      "Hatchback",
                      "Coupe",
                      "Van",
                      "Convertible",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fuel type">
                  <select name="fuelType" defaultValue={editVehicle.fuelType}>
                    {["Gasoline", "Hybrid", "Electric", "Diesel"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
                <Field
                  label="Image URL (HTTPS)"
                  name="imageUrl"
                  type="url"
                  defaultValue={editVehicle.imageUrl}
                />
              </div>
              <Field label="Description">
                <Textarea
                  name="description"
                  maxLength={2000}
                  defaultValue={editVehicle.description}
                />
              </Field>
              <label className="check-field">
                <input
                  type="checkbox"
                  name="inStock"
                  defaultChecked={editVehicle.inStock}
                />{" "}
                Available in the shopper showroom
              </label>
              <Button disabled={busy}>Save vehicle</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editLead}
        onOpenChange={(open) => !open && setEditLead(null)}
      >
        <DialogContent className="ns-dialog">
          <DialogHeader>
            <DialogTitle>{editLead?.name}</DialogTitle>
            <DialogDescription>
              {editLead?.vehicleName || "General inquiry"}
            </DialogDescription>
          </DialogHeader>
          {editLead && (
            <>
              <p>{editLead.message}</p>
              <p>
                <a href={`mailto:${editLead.email}`}>{editLead.email}</a>
                {editLead.phone && (
                  <>
                    {" "}
                    · <a href={`tel:${editLead.phone}`}>{editLead.phone}</a>
                  </>
                )}
              </p>
              <span className="subtle">
                Optional follow-up consent: {editLead.consent ? "Yes" : "No"}
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const body = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  run(async () => {
                    await mutate("/admin/leads/" + editLead.id, body);
                    setEditLead(null);
                  });
                }}
              >
                <Field label="Lead status">
                  <select name="status" defaultValue={editLead.status}>
                    {["new", "contacted", "qualified", "won", "closed"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </Field>
                <Field label="Staff notes">
                  <Textarea
                    name="notes"
                    defaultValue={editLead.notes}
                    maxLength={5000}
                  />
                </Field>
                <Button disabled={busy}>Save changes</Button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Permanently delete this lead and linked appointments?",
                      )
                    )
                      run(async () => {
                        await mutate(
                          "/admin/leads/" + editLead.id,
                          {},
                          "DELETE",
                        );
                        setEditLead(null);
                      });
                  }}
                >
                  Delete lead
                </button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={privacy} onOpenChange={setPrivacy}>
        <DialogContent className="ns-dialog">
          <DialogHeader>
            <DialogTitle>Privacy & your information.</DialogTitle>
            <DialogDescription>
              How this dealership app handles your data.
            </DialogDescription>
          </DialogHeader>
          <h3>Information you choose to share</h3>
          <p>
            Inquiry forms save your name, email, optional phone number, message,
            follow-up preference, and requested test-drive details. Authorized
            dealership staff can view these records to respond and manage
            appointments.
          </p>
          <h3>Your controls</h3>
          <p>
            Save your private request code to check status or permanently delete
            your inquiry and linked appointments under “My request.” Shortlisted
            vehicle IDs stay only on this device. Staff sign-in uses an expiring
            session.
          </p>
          <h3>Assistant and external services</h3>
          <p>
            {cfg.aiMode === "live"
              ? "Assistant messages are sent to OpenAI to produce replies."
              : "The assistant currently uses guided inventory answers without sending messages to an AI service."}{" "}
            Do not enter sensitive personal or financial information in chat.
            The app does not collect payments, credit applications, or precise
            location.
          </p>
          <h3>Contact</h3>
          <p>
            {cfg.supportEmail ? (
              <a href={`mailto:${cfg.supportEmail}`}>{cfg.supportEmail}</a>
            ) : (
              "The dealership owner must configure a privacy contact before public launch."
            )}
          </p>
          {cfg.demo && (
            <p className="notice">
              This is a preview. The operator must verify these details and
              publish their retention policy before accepting real customer
              data.
            </p>
          )}
        </DialogContent>
      </Dialog>
      {chat && (
        <section className="chat-panel" aria-label="Shopper assistant">
          <header>
            <span className="chat-icon">
              <MessageCircle size={20} />
            </span>
            <div>
              <strong>Northstar assistant</strong>
              <small>
                {cfg.aiMode === "live"
                  ? "AI-powered inventory guidance"
                  : "Guided inventory assistant"}
              </small>
            </div>
            <button aria-label="Close assistant" onClick={() => setChat(false)}>
              <X size={20} />
            </button>
          </header>
          <div className="chat-messages" aria-live="polite">
            {!messages.length ? (
              <>
                <h3>A question is a good start.</h3>
                <p>
                  I can help you explore cars, prices, sales hours, and
                  test-drive requests.
                </p>
                {[
                  "Show me SUVs under $40,000",
                  "How do I book a test drive?",
                  "What are your sales hours?",
                ].map((q) => (
                  <button
                    className="chat-prompt"
                    key={q}
                    onClick={() => sendChat(q)}
                  >
                    {q}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </>
            ) : (
              messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  {m.text}
                  {m.mode === "guided_fallback" && (
                    <small>Guided answer · Live AI unavailable</small>
                  )}
                </div>
              ))
            )}
            {busy && <p className="subtle">Working on it…</p>}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendChat();
            }}
          >
            <input
              aria-label="Message to assistant"
              placeholder="Ask about your next car…"
              value={chatInput}
              maxLength={1500}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              disabled={busy || !chatInput.trim()}
              aria-label="Send message"
            >
              <Send size={19} />
            </button>
          </form>
          <small className="chat-footnote">
            Verify vehicle details with the dealership.
          </small>
        </section>
      )}
    </div>
  );
}
function Estimator({ vehicle, currency }) {
  const [down, setDown] = useState(0),
    [rate, setRate] = useState(6.99),
    [months, setMonths] = useState(60);
  const principal = Math.max(0, vehicle.price - Number(down)),
    r = Number(rate) / 1200,
    payment = r
      ? (principal * r) / (1 - Math.pow(1 + r, -months))
      : principal / months;
  return (
    <details className="estimator">
      <summary>Explore a monthly payment estimate</summary>
      <div className="form-grid">
        <Field
          label="Down payment"
          type="number"
          min="0"
          max={vehicle.price}
          value={down}
          onChange={(e) =>
            setDown(
              Math.min(vehicle.price, Math.max(0, Number(e.target.value))),
            )
          }
        />
        <Field
          label="Annual interest rate (%)"
          type="number"
          min="0"
          max="50"
          step="0.01"
          value={rate}
          onChange={(e) =>
            setRate(Math.min(50, Math.max(0, Number(e.target.value))))
          }
        />
        <Field label="Term">
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
          >
            {[24, 36, 48, 60, 72, 84].map((n) => (
              <option key={n} value={n}>
                {n} months
              </option>
            ))}
          </select>
        </Field>
      </div>
      <strong>{price(payment, currency)} / month</strong>
      <p className="subtle">
        Illustration only. The rate is an editable assumption, not an offer.
        Excludes taxes and fees; financing requires lender approval.
      </p>
    </details>
  );
}
