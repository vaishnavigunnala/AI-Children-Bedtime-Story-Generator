import { useEffect, useMemo, useState } from "react";

const characterOptions = ["Brave rabbit", "Little astronaut", "Curious robot", "Kind princess", "Sleepy dragon"];
const themeOptions = ["Friendship", "Courage", "Honesty", "Helping friends", "Adventure"];
const ageGroups = ["3-5", "6-8", "9-12"];

const emptyStory = {
  title: "",
  story: "",
  moral: "",
  tone: "",
  continuationCount: 0
};

const emptyIllustration = {
  imageUrl: "",
  prompt: "",
  source: ""
};

const emptyProfile = {
  name: "",
  ageGroup: "6-8",
  character: "Brave rabbit",
  theme: "Friendship",
  length: "short"
};

function savedStoryKey(item) {
  return item.id || `${item.title}-${item.savedAt}`;
}

export default function App() {
  const [form, setForm] = useState({
    ageGroup: "6-8",
    childName: "",
    character: "Brave rabbit",
    theme: "Friendship",
    length: "short"
  });
  const [story, setStory] = useState(emptyStory);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [speechRate, setSpeechRate] = useState(0.85);
  const [speechStatus, setSpeechStatus] = useState("idle");
  const [illustration, setIllustration] = useState(emptyIllustration);
  const [illustrationStatus, setIllustrationStatus] = useState("idle");
  const [profiles, setProfiles] = useState([]);
  const [profileDraft, setProfileDraft] = useState(emptyProfile);
  const [activeView, setActiveView] = useState("studio");
  const [libraryFilter, setLibraryFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("bedtime-story-history");
    if (saved) {
      setHistory(JSON.parse(saved));
    }

    const savedProfiles = localStorage.getItem("bedtime-child-profiles");
    if (savedProfiles) {
      const parsedProfiles = JSON.parse(savedProfiles);
      setProfiles(parsedProfiles);
      if (parsedProfiles[0]) {
        applyProfile(parsedProfiles[0]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bedtime-story-history", JSON.stringify(history.slice(0, 30)));
  }, [history]);

  useEffect(() => {
    localStorage.setItem("bedtime-child-profiles", JSON.stringify(profiles.slice(0, 5)));
  }, [profiles]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return undefined;
    }

    function loadVoices() {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      setSelectedVoice((currentVoice) => currentVoice || availableVoices[0]?.name || "");
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const canSave = Boolean(story.title && story.story);
  const sourceLabel = useMemo(() => {
    if (!story.source) return "";
    return story.source === "openai" ? "AI generated" : "Local preview";
  }, [story.source]);

  const illustrationLabel = useMemo(() => {
    if (!illustration.source) return "";
    return illustration.source === "openai" ? "AI illustration" : "Local illustration";
  }, [illustration.source]);

  const filteredHistory = useMemo(() => {
    if (libraryFilter === "all") {
      return history;
    }

    return history.filter((item) => (item.childName || "No profile") === libraryFilter);
  }, [history, libraryFilter]);

  const libraryProfiles = useMemo(() => {
    const names = history.map((item) => item.childName || "No profile");
    return [...new Set(names)];
  }, [history]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProfileDraft(key, value) {
    setProfileDraft((current) => ({ ...current, [key]: value }));
  }

  function applyProfile(profile) {
    setForm((current) => ({
      ...current,
      ageGroup: profile.ageGroup,
      childName: profile.name,
      character: profile.character,
      theme: profile.theme,
      length: profile.length
    }));
  }

  function saveProfile(event) {
    event.preventDefault();
    const name = profileDraft.name.trim();
    if (!name) {
      setError("Add a child name before saving a profile.");
      return;
    }

    const nextProfile = {
      ...profileDraft,
      name,
      id: name.toLowerCase().replace(/\s+/g, "-")
    };

    setProfiles((current) => [nextProfile, ...current.filter((profile) => profile.id !== nextProfile.id)].slice(0, 5));
    applyProfile(nextProfile);
    setProfileDraft(emptyProfile);
    setError("");
  }

  function deleteProfile(profileId) {
    setProfiles((current) => current.filter((profile) => profile.id !== profileId));
  }

  function stopNarration() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    setSpeechStatus("idle");
  }

  async function generateIllustration(storyData = story) {
    console.log("NEW FUNCTION RUNNING");

  if (!storyData.title || !storyData.story) {
    return;
  }

  setIllustrationStatus("loading");

  try {

    const response = await fetch("/api/illustration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...form,
        title: storyData.title,
        story: storyData.story
      })
    });

    const text = await response.text();

    console.log("RAW RESPONSE:", text);

    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON returned from server");
      }
    } else {
      throw new Error("Server returned empty response");
    }

    if (!response.ok) {
      throw new Error(data.message || "Could not create illustration");
    }
    console.log("ILLUSTRATION:", data);
    setIllustration(data);

    setIllustrationStatus("done");

  } catch (error) {

    console.error(error);

    setIllustration(emptyIllustration);

    setIllustrationStatus("error");

    setError(error.message);
  }
}
  async function generateStory(event) {
  event?.preventDefault();

  setStatus("loading");
  setError("");
  setNotice("");
  setCopied(false);

  stopNarration();

  setIllustration(emptyIllustration);
  setIllustrationStatus("idle");

  try {

    const response = await fetch("/api/story", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(form)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Could not generate a story."
      );
    }

    const nextStory = {
      ...data,
      continuationCount: 0
    };

    setStory(nextStory);

    console.log("SETTING STORY:", nextStory);

    await generateIllustration(nextStory);

    setStatus("done");

    if (data.notice) {
      setNotice(data.notice);
    }

    setActiveView("studio");

  } catch (storyError) {

    console.error(storyError);

    setError(storyError.message);

    setStatus("error");
  }
}


  async function copyStory() {
    const text = `${story.title}\n\n${story.story}\n\nMoral: ${story.moral}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  function saveStory() {
    if (!canSave) return;
    const nextStory = {
      ...story,
      id: `${Date.now()}-${story.title.toLowerCase().replace(/\W+/g, "-")}`,
      childName: form.childName || "No profile",
      ageGroup: form.ageGroup,
      character: form.character,
      theme: form.theme,
      length: form.length,
      illustration,
      savedAt: new Date().toISOString()
    };
    setHistory((current) => [nextStory, ...current.filter((item) => item.id !== nextStory.id)].slice(0, 30));
    setActiveView("library");
  }

  function playNarration() {
    if (!canSave || !("speechSynthesis" in window)) {
      return;
    }

    if (speechStatus === "paused") {
      window.speechSynthesis.resume();
      setSpeechStatus("playing");
      return;
    }

    window.speechSynthesis.cancel();
    const narration = new SpeechSynthesisUtterance(`${story.title}. ${story.story} Moral: ${story.moral}`);
    narration.rate = Number(speechRate);
    narration.pitch = 0.95;
    narration.voice = voices.find((voice) => voice.name === selectedVoice) || null;
    narration.onend = () => setSpeechStatus("idle");
    narration.onerror = () => setSpeechStatus("idle");
    setSpeechStatus("playing");
    window.speechSynthesis.speak(narration);
  }

  function pauseNarration() {
    if (!("speechSynthesis" in window) || speechStatus !== "playing") {
      return;
    }

    window.speechSynthesis.pause();
    setSpeechStatus("paused");
  }

  function loadSavedStory(item) {
    stopNarration();
    setStory(item);
    setForm((current) => ({
      ...current,
      ageGroup: item.ageGroup || current.ageGroup,
      childName: item.childName === "No profile" ? "" : item.childName || current.childName,
      character: item.character || current.character,
      theme: item.theme || current.theme,
      length: item.length || current.length
    }));
    setIllustration(item.illustration || emptyIllustration);
    setIllustrationStatus(item.illustration ? "done" : "idle");
    setActiveView("studio");
  }

  function deleteSavedStory(storyId) {
    setHistory((current) => current.filter((item) => savedStoryKey(item) !== storyId));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7d6,transparent_28%),linear-gradient(135deg,#f6fbff_0%,#eaf2ff_46%,#fff2e8_100%)] text-slate-900">
      <section className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 gap-6 px-4 py-5 md:grid-cols-[390px_1fr] md:px-8 lg:px-10">
        <aside className="story-panel flex flex-col gap-5 p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-indigo-700">AI bedtime studio</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-950">Children's Story Generator</h1>
          </div>

          <div className="view-tabs" aria-label="App views">
            <button className={activeView === "studio" ? "active" : ""} onClick={() => setActiveView("studio")} type="button">
              Studio
            </button>
            <button className={activeView === "library" ? "active" : ""} onClick={() => setActiveView("library")} type="button">
              Library
            </button>
          </div>

          <section className="profile-panel">
            <h2>Child profiles</h2>
            {profiles.length > 0 && (
              <div className="profile-chips">
                {profiles.map((profile) => (
                  <span key={profile.id}>
                    <button onClick={() => applyProfile(profile)} type="button">{profile.name}</button>
                    <button aria-label={`Delete ${profile.name}`} onClick={() => deleteProfile(profile.id)} type="button">x</button>
                  </span>
                ))}
              </div>
            )}
            <form className="profile-form" onSubmit={saveProfile}>
              <label>
                Name
                <input
                  maxLength={40}
                  onChange={(event) => updateProfileDraft("name", event.target.value)}
                  placeholder="Child name"
                  value={profileDraft.name}
                />
              </label>
              <div className="profile-grid">
                <label>
                  Age
                  <select value={profileDraft.ageGroup} onChange={(event) => updateProfileDraft("ageGroup", event.target.value)}>
                    {ageGroups.map((group) => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Length
                  <select value={profileDraft.length} onChange={(event) => updateProfileDraft("length", event.target.value)}>
                    <option value="short">short</option>
                    <option value="medium">medium</option>
                  </select>
                </label>
              </div>
              <label>
                Favorite character
                <input
                  list="characters"
                  maxLength={80}
                  onChange={(event) => updateProfileDraft("character", event.target.value)}
                  value={profileDraft.character}
                />
              </label>
              <label>
                Favorite theme
                <input
                  list="themes"
                  maxLength={80}
                  onChange={(event) => updateProfileDraft("theme", event.target.value)}
                  value={profileDraft.theme}
                />
              </label>
              <button type="submit">Save profile</button>
            </form>
          </section>

          <form className="flex flex-col gap-4" onSubmit={generateStory}>
            <label className="field-label">
              Child name
              <input
                maxLength={40}
                onChange={(event) => updateForm("childName", event.target.value)}
                placeholder="Optional"
                value={form.childName}
              />
            </label>

            <label className="field-label">
              Age group
              <select value={form.ageGroup} onChange={(event) => updateForm("ageGroup", event.target.value)}>
                {ageGroups.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Character
              <input
                list="characters"
                value={form.character}
                onChange={(event) => updateForm("character", event.target.value)}
                maxLength={80}
              />
              <datalist id="characters">
                {characterOptions.map((character) => (
                  <option key={character} value={character} />
                ))}
              </datalist>
            </label>

            <label className="field-label">
              Theme
              <input
                list="themes"
                value={form.theme}
                onChange={(event) => updateForm("theme", event.target.value)}
                maxLength={80}
              />
              <datalist id="themes">
                {themeOptions.map((theme) => (
                  <option key={theme} value={theme} />
                ))}
              </datalist>
            </label>

            <fieldset className="field-label">
              Story length
              <div className="segmented">
                {["short", "medium"].map((length) => (
                  <button
                    key={length}
                    className={form.length === length ? "active" : ""}
                    type="button"
                    onClick={() => updateForm("length", length)}
                  >
                    {length}
                  </button>
                ))}
              </div>
            </fieldset>

            <button className="primary-button" disabled={status === "loading"} type="submit">
              {status === "loading" ? "Writing..." : "Generate Story"}
            </button>
          </form>

          {error && <p className="rounded-md bg-rose-100 px-3 py-2 text-sm font-medium text-rose-800">{error}</p>}
          {notice && <p className="rounded-md bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900">{notice}</p>}

          <div className="history-list">
            <div className="history-heading">
              <h2>Recent stories</h2>
              <button onClick={() => setActiveView("library")} type="button">View all</button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">Saved stories will appear here.</p>
            ) : (
              history.slice(0, 4).map((item) => (
                <button key={savedStoryKey(item)} onClick={() => loadSavedStory(item)} type="button">
                  <span>{item.title}</span>
                  <small>{item.childName || "No profile"} · {new Date(item.savedAt).toLocaleDateString()}</small>
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="output-panel min-h-[70vh] p-5 md:p-8">
          {activeView === "library" ? (
            <div className="library-view">
              <header className="library-header">
                <div>
                  <p>Story library</p>
                  <h2>Saved bedtime stories</h2>
                </div>
                <label>
                  Filter
                  <select value={libraryFilter} onChange={(event) => setLibraryFilter(event.target.value)}>
                    <option value="all">All profiles</option>
                    {libraryProfiles.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
              </header>

              {filteredHistory.length === 0 ? (
                <div className="library-empty">
                  <h3>No saved stories yet</h3>
                  <p>Generate a story, save it, and it will appear in this library.</p>
                  <button onClick={() => setActiveView("studio")} type="button">Back to studio</button>
                </div>
              ) : (
                <div className="library-grid">
                  {filteredHistory.map((item) => (
                    <article className="library-card" key={savedStoryKey(item)}>
                      {item.illustration?.imageUrl ? (
                        <img
  src={item?.illustration?.imageUrl || "https://picsum.photos/800/500"}
  alt={`Illustration for ${item?.title}`}
  style={{
    width: "100%",
    height: "400px",
    objectFit: "cover",
    borderRadius: "24px"
  }}
  onError={(e) => {
    console.log("Image failed, loading fallback...");
    e.target.src = "https://picsum.photos/800/500";
  }}
/>
                      ) : (
                        <div className="library-card-empty" />
                      )}
                      <div className="library-card-body">
                        <div className="library-meta">
                          <span>{item.childName || "No profile"}</span>
                          <span>{item.theme || "Theme"}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.story}</p>
                        <small>{new Date(item.savedAt).toLocaleString()}</small>
                        <div className="library-actions">
                          <button onClick={() => loadSavedStory(item)} type="button">Open</button>
                          <button onClick={() => deleteSavedStory(savedStoryKey(item))} type="button">Delete</button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
          <div className="story-stage">
            <div className="moon-scene" aria-hidden="true">
              <div className="moon" />
              <span className="star star-one" />
              <span className="star star-two" />
              <span className="star star-three" />
            </div>

            {story && story.story ? (
              <article className="story-card">
                <div className="story-meta">
                  <span>{sourceLabel}</span>
                  <span>{story.tone}</span>
                  {story.continuationCount > 0 && <span>Continued {story.continuationCount}x</span>}
                </div>
                <figure className="illustration-panel">
                  {illustration.imageUrl ? (
                    <img
                      src={illustration?.imageUrl}
                      alt={`Illustration for ${story?.title}`}
                      className="w-full h-full object-cover rounded-3xl"
                    />
                  ) : (
                    <div className="illustration-empty">
                      <span>{illustrationStatus === "loading" ? "Painting..." : "Illustration will appear here"}</span>
                    </div>
                  )}
                  <figcaption>
                    <span>{illustrationLabel || "Story scene"}</span>
                    <button disabled={illustrationStatus === "loading"} onClick={() => generateIllustration()} type="button">
                      {illustrationStatus === "loading" ? "Painting..." : "Regenerate image"}
                    </button>
                  </figcaption>
                </figure>
                <h2>{story.title}</h2>
                <p className="story-text">{story.story}</p>
                <div className="moral-box">
                  <strong>Moral</strong>
                  <p>{story.moral}</p>
                </div>
                <div className="actions">
                  <button onClick={copyStory} type="button">{copied ? "Copied" : "Copy"}</button>
                  <button onClick={generateStory} type="button">Regenerate</button>
                  <button disabled={!canSave} onClick={saveStory} type="button">Save</button>
                </div>
                <div className="narration-panel">
                  <div className="narration-controls">
                    <button disabled={!canSave || speechStatus === "playing"} onClick={playNarration} type="button">
                      {speechStatus === "paused" ? "Resume" : "Play audio"}
                    </button>
                    <button disabled={speechStatus !== "playing"} onClick={pauseNarration} type="button">Pause</button>
                    <button disabled={speechStatus === "idle"} onClick={stopNarration} type="button">Stop</button>
                  </div>
                  <div className="audio-options">
                    <label>
                      Voice
                      <select
                        disabled={voices.length === 0}
                        value={selectedVoice}
                        onChange={(event) => setSelectedVoice(event.target.value)}
                      >
                        {voices.length === 0 ? (
                          <option>Browser default</option>
                        ) : (
                          voices.map((voice) => (
                            <option key={voice.name} value={voice.name}>
                              {voice.name}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                    <label>
                      Speed
                      <input
                        max="1.15"
                        min="0.65"
                        onChange={(event) => setSpeechRate(event.target.value)}
                        step="0.05"
                        type="range"
                        value={speechRate}
                      />
                      <span>{Number(speechRate).toFixed(2)}x</span>
                    </label>
                  </div>
                </div>
              </article>
            ) : (
              <div className="empty-state">
                <h2>Ready for a gentle story?</h2>
                <p>Choose an age, character, theme, and length to create a calm bedtime tale.</p>
              </div>
            )}
          </div>
          )}
        </section>
      </section>
    </main>
  );
}
