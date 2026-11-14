(function () {
  "use strict";

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const body = document.body;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionLite =
    reducedMotion ||
    window.matchMedia("(max-width: 760px)").matches ||
    (typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4) ||
    (typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 4) ||
    Boolean(navigator.connection && navigator.connection.saveData);

  if (motionLite) {
    document.documentElement.classList.add("motion-lite");
  }

  /* ------------------------------------------------------------------------
     Utilities
     ------------------------------------------------------------------------ */

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function pad(value, length) {
    return String(value).padStart(length, "0");
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readStoredNumber(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === "") return fallback;
      const value = Number(raw);
      return Number.isFinite(value) ? value : fallback;
    } catch (error) {
      return fallback;
    }
  }

  const toastElement = $("#toast");
  let toastTimer = null;

  function toast(message, duration) {
    if (!toastElement) return;
    toastElement.textContent = message;
    toastElement.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toastElement.classList.remove("is-on");
    }, duration || 3200);
  }

  /* ------------------------------------------------------------------------
     Masthead status
     ------------------------------------------------------------------------ */

  const statusElement = $("#statusText");
  const statuses = [
    "RECEIVING",
    "NO CARRIER",
    "SIGNAL CORRUPTED",
    "AWAITING REPLY",
    "DO NOT ADJUST",
    "LISTENING"
  ];
  let statusIndex = 0;

  if (statusElement) {
    window.setInterval(function () {
      statusIndex = (statusIndex + 1) % statuses.length;
      statusElement.textContent = statuses[statusIndex];
    }, 6200);
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll
     ------------------------------------------------------------------------ */

  const revealElements = $$(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach(function (element) {
      element.classList.add("is-in");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -8% 0px" }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });

    window.setTimeout(function () {
      revealElements.forEach(function (element) {
        if (!element.classList.contains("is-in")) element.classList.add("is-in");
      });
    }, 5000);
  }

  /* ------------------------------------------------------------------------
     Dialogs shared state
     ------------------------------------------------------------------------ */

  const indexDialog = $("#indexDialog");
  const plateDialog = $("#plateDialog");
  const relicDialog = $("#relicDialog");

  function syncModalState() {
    const open = Boolean(
      (indexDialog && indexDialog.open) ||
        (plateDialog && plateDialog.open) ||
        (relicDialog && relicDialog.open)
    );
    body.classList.toggle("modal-open", open);
  }

  /* ------------------------------------------------------------------------
     Index
     ------------------------------------------------------------------------ */

  let lastIndexTrigger = null;
  let restoreIndexFocus = true;

  function openIndex(trigger) {
    if (!indexDialog || indexDialog.open) return;
    playSfx("paper");
    lastIndexTrigger = trigger || null;
    restoreIndexFocus = true;

    if (typeof indexDialog.showModal === "function") {
      indexDialog.showModal();
    } else {
      indexDialog.setAttribute("open", "");
    }

    syncModalState();
  }

  function closeIndex(restoreFocus) {
    if (!indexDialog) return;
    restoreIndexFocus = restoreFocus !== false;

    if (typeof indexDialog.close === "function") {
      indexDialog.close();
    } else {
      indexDialog.removeAttribute("open");
      if (restoreIndexFocus && lastIndexTrigger) lastIndexTrigger.focus();
    }

    syncModalState();
  }

  $$("[data-open-index]").forEach(function (button) {
    button.addEventListener("click", function () {
      openIndex(button);
    });
  });

  $$("[data-close-index]").forEach(function (button) {
    button.addEventListener("click", function () {
      closeIndex(true);
    });
  });

  if (indexDialog) {
    indexDialog.addEventListener("close", function () {
      syncModalState();
      if (restoreIndexFocus && lastIndexTrigger) lastIndexTrigger.focus();
    });

    indexDialog.addEventListener("click", function (event) {
      if (event.target === indexDialog) closeIndex(true);
    });
  }

  $$("[data-index-link]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const targetSelector = link.getAttribute("href");
      const target = targetSelector ? document.querySelector(targetSelector) : null;

      closeIndex(false);

      if (!target) return;

      window.setTimeout(function () {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start"
        });
      }, 30);
    });
  });

  document.addEventListener("keydown", function (event) {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    const editing = /INPUT|TEXTAREA|SELECT/.test(tag);
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;

    if (
      event.key.toLowerCase() === "i" &&
      !editing &&
      !hasModifier &&
      !(plateDialog && plateDialog.open) &&
      !(relicDialog && relicDialog.open)
    ) {
      event.preventDefault();
      if (indexDialog && indexDialog.open) {
        closeIndex(true);
      } else {
        openIndex(document.activeElement);
      }
    }
  });

  /* ------------------------------------------------------------------------
     Specimen plates
     ------------------------------------------------------------------------ */

  const plates = {
    witness: {
      no: "PLATE 01",
      title: "THE WITNESS",
      meta: "SILVER GELATIN / 1896",
      img: "assets/img/eye.webp",
      alt: "A close profile portrait of a woman with a cap and a cigarette.",
      w: 820,
      h: 633,
      text:
        "A face cropped until only the act of looking remains. The eye is the only organ that cannot be closed from the inside. This is not true. Keep it anyway.",
      source:
        "Frances Benjamin Johnston, Self-Portrait (as “New Woman”), 1896. Public domain, Wikimedia Commons."
    },
    choir: {
      no: "PLATE 02",
      title: "THE CHOIR",
      meta: "FOUR EXPOSURES / 1896",
      img: "assets/img/eye-grid.webp",
      alt: "A mirrored four-part study of a woman's face.",
      w: 1000,
      h: 1000,
      text:
        "One face repeated four times, mirrored until it becomes a congregation. Do not look for the original. There is no original.",
      source:
        "Frances Benjamin Johnston, Self-Portrait (as “New Woman”), 1896. Public domain, Wikimedia Commons."
    },
    moth: {
      no: "PLATE 03",
      title: "THE MOURNER",
      meta: "ENGRAVING / 1794",
      img: "assets/img/moth.jpg",
      alt: "An engraved moth on a pale background.",
      w: 760,
      h: 516,
      text:
        "A moth drawn with the patience of a court stenographer. It arrives at night, like all bad news. It is not carrying a message. It is the message.",
      source:
        "John Harris, Phalaena Aceris Acer Rubrum, Plate 93, 1794. CC0, Yale Center for British Art."
    },
    flower: {
      no: "PLATE 04",
      title: "BOTANICAL ERROR",
      meta: "LITHOGRAPH / C. 1830",
      img: "assets/img/flower.webp",
      alt: "A fine black-and-white botanical engraving of a leafy plant.",
      w: 650,
      h: 902,
      text:
        "A plant that grows only in scanned documents. Its flowers are small, black, and perfectly illegible. Do not water it.",
      source:
        "Bocagea viridis, botanical plate, c. 1830. Public domain, Wikimedia Commons."
    },
    map: {
      no: "PLATE 05",
      title: "THE FIELD",
      meta: "COPPERPLATE / 1794",
      img: "assets/img/map.webp",
      alt: "A detail from an antique world map showing continents and ocean.",
      w: 1000,
      h: 1000,
      text:
        "Every border is a scar that has been agreed upon. The ocean has no opinion. The map has several.",
      source:
        "Samuel Dunn, A General Map of the World, 1794. Public domain, Wikimedia Commons."
    },
    head: {
      no: "PLATE 06",
      title: "ANATOMY OF A VOICE",
      meta: "ANATOMICAL ENGRAVING / 1831",
      img: "assets/img/head.webp",
      alt: "An anatomical engraving of a human head and neck in profile.",
      w: 760,
      h: 1252,
      text:
        "The mouth is open. Nothing is coming out. This is a diagram of a voice learning how to leave the body.",
      source:
        "William Home Lizars, anatomical plate IX, 1831. CC0, The Metropolitan Museum of Art."
    },
    swarm: {
      no: "PLATE 07",
      title: "THE SWARM",
      meta: "CHROMOLITHOGRAPH / 1898",
      img: "assets/img/butterfly.webp",
      alt: "A dense antique plate of butterflies and chrysalises.",
      w: 880,
      h: 1219,
      text:
        "A catalogue of transformations that never completed. The chrysalis is the only honest room in the house.",
      source:
        "The Butterfly Book, Plate IV, 1898. Public domain, Wikimedia Commons."
    },
    hand: {
      no: "PLATE 08",
      title: "THE HAND",
      meta: "INK STUDY / MMXXVI",
      img: "assets/svg/plate-hand.svg",
      alt: "A black handprint with a red registration target and pale finger lines.",
      w: 600,
      h: 760,
      text:
        "A hand pressed into the page after the original was removed from the file. The registration target is not part of the anatomy. It was added later, by someone who wanted the print to be watched.",
      source:
        "Original print illustration made for this publication. No external source."
    },
    wheel: {
      no: "PLATE 09",
      title: "THE WHEEL",
      meta: "INK & RED / MMXXVI",
      img: "assets/svg/plate-wheel.svg",
      alt: "A black poster with a rough white wheel, moth-like forms and red radial marks.",
      w: 600,
      h: 760,
      text:
        "A wheel for turning a question until it becomes a different question. The moth is the only moving part. Do not oil it.",
      source:
        "Original ink and red illustration made for this publication. No external source."
    },
    spiral: {
      no: "PLATE 10",
      title: "THE SPIRAL",
      meta: "INK STUDY / MMXXVI",
      img: "assets/svg/plate-spiral.svg",
      alt: "A rough black ink spiral with red marks and a short inscription.",
      w: 600,
      h: 760,
      text:
        "A spiral is a line that refuses to leave. Follow it inward and the archive becomes a room. Follow it outward and the room becomes an archive.",
      source:
        "Original ink illustration made for this publication. No external source."
    },
    errata: {
      no: "PLATE 11",
      title: "THE ERRATA",
      meta: "WRONG INK / MMXXVI",
      img: "assets/svg/plate-errata.svg",
      alt: "A bright yellow errata plate with a black handprint, blue offset, registration target and colour bars.",
      w: 600,
      h: 760,
      text:
        "A plate printed after the archive was closed. The yellow was not in the palette. The blue was not in the file. The hand was not in the negative. Nobody signed for it. The correction is to leave it visible.",
      source:
        "Original illustration made for this publication. No external source."
    }
  };

  const plateOrder = ["witness", "choir", "moth", "flower", "map", "head", "swarm", "hand", "wheel", "spiral", "errata"];
  let currentPlateIndex = 0;
  let lastPlateTrigger = null;

  const plateDialogImage = $("#plateDialogImage");
  const plateDialogNo = $("#plateDialogNo");
  const plateDialogMeta = $("#plateDialogMeta");
  const plateDialogTitle = $("#plateDialogTitle");
  const plateDialogText = $("#plateDialogText");
  const plateDialogSource = $("#plateDialogSource");
  const plateClose = $("#plateClose");
  const platePrev = $("#platePrev");
  const plateNext = $("#plateNext");

  function renderPlate(index) {
    const data = plates[plateOrder[index]];
    if (!data) return;

    currentPlateIndex = index;

    if (plateDialogImage) {
      plateDialogImage.src = data.img;
      plateDialogImage.alt = data.alt;
      plateDialogImage.width = data.w;
      plateDialogImage.height = data.h;
    }
    if (plateDialogNo) plateDialogNo.textContent = data.no + " / " + data.title;
    if (plateDialogMeta) plateDialogMeta.textContent = data.meta;
    if (plateDialogTitle) plateDialogTitle.textContent = data.title;
    if (plateDialogText) plateDialogText.textContent = data.text;
    if (plateDialogSource) plateDialogSource.textContent = data.source;
  }

  function openPlate(key, trigger) {
    if (!plateDialog || plateDialog.open) return;
    const index = plateOrder.indexOf(key);
    if (index < 0) return;

    playSfx("static");
    lastPlateTrigger = trigger || null;
    renderPlate(index);

    if (typeof plateDialog.showModal === "function") {
      plateDialog.showModal();
    } else {
      plateDialog.setAttribute("open", "");
    }

    syncModalState();
    plateDialog.scrollTop = 0;
  }

  function closePlate() {
    if (!plateDialog) return;
    if (typeof plateDialog.close === "function") {
      plateDialog.close();
    } else {
      plateDialog.removeAttribute("open");
      syncModalState();
      if (lastPlateTrigger) lastPlateTrigger.focus();
    }
  }

  $$("[data-plate]").forEach(function (button) {
    button.addEventListener("click", function () {
      openPlate(button.getAttribute("data-plate"), button);
    });
  });

  if (plateClose) plateClose.addEventListener("click", closePlate);

  if (platePrev) {
    platePrev.addEventListener("click", function () {
      const next = (currentPlateIndex - 1 + plateOrder.length) % plateOrder.length;
      renderPlate(next);
    });
  }

  if (plateNext) {
    plateNext.addEventListener("click", function () {
      const next = (currentPlateIndex + 1) % plateOrder.length;
      renderPlate(next);
    });
  }

  if (plateDialog) {
    plateDialog.addEventListener("close", function () {
      syncModalState();
      if (lastPlateTrigger) lastPlateTrigger.focus();
    });

    plateDialog.addEventListener("click", function (event) {
      if (event.target === plateDialog) closePlate();
    });
  }

  /* ------------------------------------------------------------------------
     Moth (a small, unnecessary secret)
     ------------------------------------------------------------------------ */

  const mothTrigger = $("[data-moth]");
  let mothTouches = 0;
  let mothResetTimer = null;

  function flashSeenOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "seen-overlay";
    overlay.setAttribute("role", "status");
    overlay.innerHTML =
      "<div><span>YOU HAVE BEEN SEEN.</span><small>THIS IS NOT A THREAT. IT IS A RECORD.</small></div>";
    document.body.appendChild(overlay);

    window.setTimeout(function () {
      overlay.remove();
    }, 2600);
  }

  if (mothTrigger) {
    mothTrigger.addEventListener("click", function () {
      mothTouches += 1;
      window.clearTimeout(mothResetTimer);

      if (mothTouches === 1) {
        toast("THE MOTH IS NOT A BUTTON.");
      } else if (mothTouches === 2) {
        toast("PLEASE STOP.");
      } else {
        mothTouches = 0;
        flashSeenOverlay();
        toast("YOU HAVE BEEN SEEN.", 4000);
      }

      mothResetTimer = window.setTimeout(function () {
        mothTouches = 0;
      }, 6500);
    });
  }

  /* ------------------------------------------------------------------------
     The cutting table
     ------------------------------------------------------------------------ */

  const cuttingBoard = $("#cuttingBoard");
  const cuttingScraps = cuttingBoard
    ? Array.from(cuttingBoard.querySelectorAll(".scrap"))
    : [];
  const tableStatus = $("#tableStatus");
  const tableCount = $("#tableCount");
  const tableShuffle = $("#tableShuffle");
  const tableTurn = $("#tableTurn");
  const tableReset = $("#tableReset");

  const tableOriginals = new Map();
  let selectedScrap = null;
  let tableMoves = 0;
  let dragState = null;

  function numberFromData(element, key, fallback) {
    const value = Number(element.dataset[key]);
    return Number.isFinite(value) ? value : fallback;
  }

  function clampTableX(value) {
    return Math.max(0, Math.min(0.9, value));
  }

  function clampTableY(value) {
    return Math.max(0, Math.min(0.86, value));
  }

  function normaliseRotation(value) {
    let rotation = value % 360;
    if (rotation > 180) rotation -= 360;
    if (rotation < -180) rotation += 360;
    return rotation;
  }

  function scrapLabel(element) {
    return (element.getAttribute("aria-label") || "UNNAMED FRAGMENT")
      .replace(" scrap", "")
      .replace(": ", " / ")
      .toUpperCase();
  }

  function updateTableStatus(prefix) {
    if (!tableStatus) return;

    if (!selectedScrap) {
      tableStatus.textContent = prefix || "NO PIECE SELECTED / TABLE IS OPEN.";
      return;
    }

    const x = Math.round(numberFromData(selectedScrap, "x", 0) * 1000) / 10;
    const y = Math.round(numberFromData(selectedScrap, "y", 0) * 1000) / 10;
    const rotation = Math.round(numberFromData(selectedScrap, "rot", 0));

    tableStatus.textContent =
      (prefix ? prefix + " / " : "") +
      scrapLabel(selectedScrap) +
      " / X " + x.toFixed(1) +
      " Y " + y.toFixed(1) +
      " / ROT " + rotation + "°";
  }

  function selectScrap(element, moveFocus) {
    cuttingScraps.forEach(function (scrap) {
      scrap.classList.toggle("is-selected", scrap === element);
    });
    selectedScrap = element;

    if (element && moveFocus) {
      try {
        element.focus({ preventScroll: true });
      } catch (error) {
        element.focus();
      }
    }

    updateTableStatus();
  }

  function placeScrap(element, x, y, rotation) {
    const nextX = clampTableX(x);
    const nextY = clampTableY(y);
    const nextRotation = normaliseRotation(rotation);

    element.dataset.x = String(nextX);
    element.dataset.y = String(nextY);
    element.dataset.rot = String(nextRotation);
    element.style.setProperty("--x", String(nextX));
    element.style.setProperty("--y", String(nextY));
    element.style.setProperty("--r", nextRotation + "deg");
  }

  function turnScrap(element, degrees) {
    if (!element) return;
    placeScrap(
      element,
      numberFromData(element, "x", 0),
      numberFromData(element, "y", 0),
      numberFromData(element, "rot", 0) + degrees
    );
  }

  cuttingScraps.forEach(function (scrap) {
    tableOriginals.set(scrap, {
      x: numberFromData(scrap, "x", 0),
      y: numberFromData(scrap, "y", 0),
      rot: numberFromData(scrap, "rot", 0)
    });

    scrap.addEventListener("pointerdown", function (event) {
      if (event.button !== undefined && event.button !== 0) return;

      event.preventDefault();
      selectScrap(scrap, true);

      const boardRect = cuttingBoard.getBoundingClientRect();
      dragState = {
        element: scrap,
        pointerId: event.pointerId,
        boardRect: boardRect,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startX: numberFromData(scrap, "x", 0),
        startY: numberFromData(scrap, "y", 0)
      };

      boardRect && cuttingBoard.classList.add("is-dragging");

      try {
        scrap.setPointerCapture(event.pointerId);
      } catch (error) {
        /* Pointer capture is optional; the move handler still works. */
      }
    });

    scrap.addEventListener("pointermove", function (event) {
      if (
        !dragState ||
        dragState.element !== scrap ||
        event.pointerId !== dragState.pointerId
      ) {
        return;
      }

      const dx = (event.clientX - dragState.startClientX) / dragState.boardRect.width;
      const dy = (event.clientY - dragState.startClientY) / dragState.boardRect.height;

      placeScrap(scrap, dragState.startX + dx, dragState.startY + dy, numberFromData(scrap, "rot", 0));
    });

    function finishDrag(event) {
      if (
        !dragState ||
        dragState.element !== scrap ||
        event.pointerId !== dragState.pointerId
      ) {
        return;
      }

      try {
        scrap.releasePointerCapture(event.pointerId);
      } catch (error) {
        /* Nothing to release. */
      }

      dragState = null;
      cuttingBoard.classList.remove("is-dragging");
      updateTableStatus("PLACED");
    }

    scrap.addEventListener("pointerup", finishDrag);
    scrap.addEventListener("pointercancel", finishDrag);

    scrap.addEventListener("keydown", function (event) {
      const step = event.shiftKey ? 0.05 : 0.012;
      let handled = true;

      if (event.key === "ArrowLeft") {
        placeScrap(scrap, numberFromData(scrap, "x", 0) - step, numberFromData(scrap, "y", 0), numberFromData(scrap, "rot", 0));
      } else if (event.key === "ArrowRight") {
        placeScrap(scrap, numberFromData(scrap, "x", 0) + step, numberFromData(scrap, "y", 0), numberFromData(scrap, "rot", 0));
      } else if (event.key === "ArrowUp") {
        placeScrap(scrap, numberFromData(scrap, "x", 0), numberFromData(scrap, "y", 0) - step, numberFromData(scrap, "rot", 0));
      } else if (event.key === "ArrowDown") {
        placeScrap(scrap, numberFromData(scrap, "x", 0), numberFromData(scrap, "y", 0) + step, numberFromData(scrap, "rot", 0));
      } else if (event.key === "[" || event.key === "]") {
        turnScrap(scrap, event.key === "[" ? -5 : 5);
      } else {
        handled = false;
      }

      if (handled) {
        event.preventDefault();
        selectScrap(scrap, false);
        updateTableStatus("MOVED");
      }
    });

    scrap.addEventListener("focus", function () {
      selectScrap(scrap, false);
    });
  });

  if (cuttingBoard) {
    cuttingBoard.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".scrap")) return;
      selectScrap(null, false);
    });
  }

  if (tableTurn) {
    tableTurn.addEventListener("click", function () {
      if (!selectedScrap) {
        updateTableStatus("SELECT A PIECE FIRST.");
        return;
      }
      turnScrap(selectedScrap, 15);
      updateTableStatus("TURNED");
    });
  }

  if (tableShuffle) {
    tableShuffle.addEventListener("click", function () {
      cuttingScraps.forEach(function (scrap) {
        const width = numberFromData(scrap, "w", 0.2);
        const x = (randomInt(2, 82) / 100) * Math.max(0.55, 1 - width);
        const y = randomInt(4, 72) / 100;
        placeScrap(scrap, x, y, randomInt(-12, 12));
      });

      tableMoves += 1;
      if (tableCount) tableCount.textContent = pad(tableMoves, 3);
      selectScrap(null, false);

      if (tableMoves === 3) {
        updateTableStatus("THE TABLE REMEMBERS YOU / NO ORIGINAL.");
      } else if (tableMoves === 7) {
        updateTableStatus("STOP ARRANGING. IT IS ALREADY FINISHED.");
      } else {
        updateTableStatus("TABLE SHUFFLED / " + pad(tableMoves, 3) + " ARRANGEMENTS.");
      }
    });
  }

  if (tableReset) {
    tableReset.addEventListener("click", function () {
      cuttingScraps.forEach(function (scrap) {
        const original = tableOriginals.get(scrap);
        if (!original) return;
        placeScrap(scrap, original.x, original.y, original.rot);
      });

      tableMoves = 0;
      if (tableCount) tableCount.textContent = "000";
      cuttingScraps.forEach(function (scrap) {
        scrap.classList.remove("is-selected");
      });
      selectedScrap = null;
      updateTableStatus("TABLE RESET / NO ORIGINAL.");
    });
  }

  /* ------------------------------------------------------------------------
     Sigil engine
     ------------------------------------------------------------------------ */

  const sigilSvg = $("#sigilSvg");
  const sigilMachine = $("#sigilMachine");
  const generateSigilButton = $("#generateSigil");
  const downloadSigilButton = $("#downloadSigil");
  const sigilName = $("#sigilName");
  const sigilCode = $("#sigilCode");
  const sigilInstruction = $("#sigilInstruction");
  const sigilCount = $("#sigilCount");
  const apparatusSecret = $("#apparatusSecret");

  const sigilSubjects = [
    "MOUTH",
    "ROOM",
    "SECOND MOON",
    "WITNESS",
    "WHITE DOOR",
    "SMALL DEATH",
    "UNNAMED",
    "LAST SIGNAL",
    "BODY",
    "ARCHIVE"
  ];
  const sigilVerbs = [
    "THAT REMEMBERS",
    "THAT REFUSES",
    "THAT LISTENS",
    "THAT FORGETS",
    "THAT WAITS BEHIND",
    "THAT SPEAKS IN",
    "THAT CANNOT",
    "THAT DREAMS OF",
    "THAT SWALLOWS",
    "THAT RETURNS AS"
  ];
  const sigilObjects = [
    "ITS OWN NAME",
    "THE LIGHT",
    "A BORROWED VOICE",
    "YOUR REFLECTION",
    "THE STATIC",
    "A CLOSED MOUTH",
    "THE OTHER ROOM",
    "A SECOND SHADOW",
    "THE UNFINISHED SENTENCE",
    "NOTHING"
  ];
  const sigilInstructions = [
    "BURY IT WHERE THE WIFI DIES.",
    "DO NOT SHOW THIS TO ANYONE.",
    "READ IT BACKWARDS AT 3:33.",
    "KEEP IT IN YOUR MOUTH UNTIL MORNING.",
    "DRAW IT AGAIN. SLOWER.",
    "THIS ONE IS ALREADY YOURS.",
    "DO NOT LET IT SEE THE DOOR.",
    "LEAVE IT FACE DOWN FOR THREE DAYS."
  ];
  const sigilNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  let sigilGeneration = 0;
  let currentSigilMarkup = "";
  let currentSigilData = null;

  function sigilRing(cx, cy, radius, stroke, dash, opacity) {
    const dashattr = dash ? ' stroke-dasharray="' + dash + '"' : "";
    const opacityattr = opacity ? ' opacity="' + opacity + '"' : "";
    return (
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + radius + '" fill="none" stroke="' +
      stroke + '" stroke-width="1.1"' + dashattr + opacityattr + "/>"
    );
  }

  function makeScribble(cx, cy, width, height, stroke) {
    const points = [];
    const count = randomInt(5, 8);
    for (let i = 0; i < count; i += 1) {
      points.push({
        x: cx - width / 2 + (width / (count - 1)) * i,
        y: cy + randomInt(-height / 2, height / 2)
      });
    }

    let d = "M" + points[0].x + " " + points[0].y;
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i - 1];
      const current = points[i];
      const midX = (prev.x + current.x) / 2;
      const midY = (prev.y + current.y) / 2 + randomInt(-17, 17);
      d += " Q" + midX + " " + midY + " " + current.x + " " + current.y;
    }

    return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="2.1" stroke-linecap="round"/>';
  }

  function createSigilMarkup() {
    const cx = 250;
    const cy = 250;
    const title =
      "THE " + pick(sigilSubjects) + " " + pick(sigilVerbs) + " " + pick(sigilObjects);
    const instruction = pick(sigilInstructions);
    const numberOfPoints = pick([3, 3, 4, 5, 6]);
    const outer = randomInt(166, 188);
    const shapeRadius = randomInt(106, 152);
    const blackParts = [];
    const redParts = [];

    blackParts.push(sigilRing(cx, cy, outer, "#000", "", "0.9"));
    blackParts.push(sigilRing(cx, cy, randomInt(132, 152), "#000", randomInt(2, 5) + " " + randomInt(6, 12), "0.65"));
    blackParts.push(
      '<ellipse cx="250" cy="250" rx="' + randomInt(144, 190) + '" ry="' + randomInt(53, 110) +
      '" fill="none" stroke="#000" stroke-width="1.1" transform="rotate(' + randomInt(0, 179) +
      ' 250 250)"/>'
    );
    blackParts.push('<path d="M250 ' + randomInt(20, 42) + 'V' + randomInt(458, 480) + 'M' + randomInt(20, 42) + ' 250H' + randomInt(458, 480) + '" fill="none" stroke="#000" stroke-width="1.1"/>');

    const points = [];
    for (let i = 0; i < numberOfPoints; i += 1) {
      const angle = (Math.PI * 2 * i) / numberOfPoints - Math.PI / 2 + randomInt(-8, 8) / 100;
      points.push(
        (cx + Math.cos(angle) * shapeRadius).toFixed(1) +
          "," +
          (cy + Math.sin(angle) * shapeRadius).toFixed(1)
      );
    }
    blackParts.push(
      '<polygon points="' + points.join(" ") + '" fill="none" stroke="#000" stroke-width="1.2" stroke-dasharray="' +
      (Math.random() > 0.55 ? "2 7" : "") + '"/>'
    );

    for (let i = 0; i < 28; i += 1) {
      const angle = (Math.PI * 2 * i) / 28;
      const inner = outer - randomInt(4, 15);
      const x1 = cx + Math.cos(angle) * outer;
      const y1 = cy + Math.sin(angle) * outer;
      const x2 = cx + Math.cos(angle) * inner;
      const y2 = cy + Math.sin(angle) * inner;
      blackParts.push(
        '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) +
        '" stroke="#000" stroke-width="1"/>'
      );
    }

    for (let i = 0; i < randomInt(2, 4); i += 1) {
      const start = randomInt(0, 360);
      const length = randomInt(30, 115);
      const radius = randomInt(58, 132);
      const startRad = (start * Math.PI) / 180;
      const endRad = ((start + length) * Math.PI) / 180;
      const x1 = cx + Math.cos(startRad) * radius;
      const y1 = cy + Math.sin(startRad) * radius;
      const x2 = cx + Math.cos(endRad) * radius;
      const y2 = cy + Math.sin(endRad) * radius;
      blackParts.push(
        '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + "A" + radius + " " + radius + " 0 0 1 " +
        x2.toFixed(1) + " " + y2.toFixed(1) + '" fill="none" stroke="#000" stroke-width="1.1"/>'
      );
    }

    blackParts.push('<circle cx="250" cy="250" r="' + randomInt(14, 35) + '" fill="none" stroke="#000" stroke-width="1.2"/>');
    blackParts.push('<circle cx="250" cy="250" r="3.2" fill="#000"/>');

    for (let i = 0; i < 12; i += 1) {
      if (Math.random() < 0.38) {
        const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
        blackParts.push(
          '<text x="' + (cx + Math.cos(angle) * 202).toFixed(1) + '" y="' +
          (cy + Math.sin(angle) * 202 + 3).toFixed(1) +
          '" text-anchor="middle" font-family="monospace" font-size="6" fill="#000" opacity=".65">' +
          sigilNumerals[i] + "</text>"
        );
      }
    }

    redParts.push(makeScribble(250, randomInt(210, 300), randomInt(250, 380), randomInt(90, 170), "#b00000"));
    redParts.push(
      '<circle cx="' + randomInt(140, 360) + '" cy="' + randomInt(120, 380) + '" r="' +
      randomInt(14, 31) + '" fill="none" stroke="#b00000" stroke-width="1.7" stroke-dasharray="1 5"/>'
    );
    redParts.push(
      '<path d="M' + randomInt(70, 165) + " " + randomInt(285, 380) + "l" + randomInt(18, 44) + " " + randomInt(-18, 18) +
      '" stroke="#b00000" stroke-width="2.8" stroke-linecap="round"/>'
    );
    if (Math.random() > 0.38) {
      redParts.push(
        '<path d="M' + randomInt(120, 210) + ' ' + randomInt(110, 180) + "l" + randomInt(25, 55) + " " + randomInt(18, 46) +
        '" stroke="#b00000" stroke-width="2.2" stroke-linecap="round"/>'
      );
    }

    const codeSuffix = String.fromCharCode(65 + randomInt(0, 25));
    const generation = sigilGeneration;
    const code = "SIG-" + pad(generation, 4) + "-" + codeSuffix;

    const markup =
      '<g stroke-linecap="round" stroke-linejoin="round">' +
      blackParts.join("") +
      '</g><g stroke-linecap="round" stroke-linejoin="round">' +
      redParts.join("") +
      "</g>" +
      '<text x="250" y="481" text-anchor="middle" font-family="monospace" font-size="6" letter-spacing="2.2" fill="#000">' +
      code + "</text>" +
      '<text x="250" y="26" text-anchor="middle" font-family="monospace" font-size="5.5" letter-spacing="2" fill="#b00000">' +
      "APPARATUS 04 / NO FIXED MEANING</text>";

    return { title: title, instruction: instruction, code: code, markup: markup };
  }

  function drawSigil(initial) {
    if (!sigilSvg) return;

    sigilGeneration += 1;

    const data = createSigilMarkup();
    currentSigilData = data;
    currentSigilMarkup = data.markup;

    sigilSvg.innerHTML =
      '<title id="sigilTitle">' + escapeXml(data.title) + "</title>" +
      '<desc id="sigilDesc">A generated diagram of circles, lines, numerals and red marks. ' +
      escapeXml(data.name || "Generated by the sigil engine.") + "</desc>" +
      data.markup;

    if (sigilName) sigilName.textContent = data.title;
    if (sigilCode) sigilCode.textContent = data.code;
    if (sigilInstruction) sigilInstruction.textContent = data.instruction;
    if (sigilCount) sigilCount.textContent = "NO. " + pad(sigilGeneration, 3);

    if (apparatusSecret) {
      if (sigilGeneration === 4) {
        apparatusSecret.textContent = "IT IS LEARNING YOUR HAND.";
      } else if (sigilGeneration === 7) {
        apparatusSecret.textContent = "THE MACHINE REMEMBERS YOU. IT WILL NOT SAY HOW.";
      } else if (sigilGeneration === 11) {
        apparatusSecret.textContent = "STOP DRAWING. IT IS ALREADY FINISHED.";
      } else if (!initial) {
        apparatusSecret.textContent = "";
      }
    }

    if (sigilMachine) {
      sigilMachine.classList.remove("is-drawing");
      void sigilMachine.offsetWidth;
      sigilMachine.classList.add("is-drawing");
      window.setTimeout(function () {
        sigilMachine.classList.remove("is-drawing");
      }, 450);
    }
  }

  function downloadSigil() {
    if (!currentSigilData) return;

    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 500 500">' +
      '<rect width="500" height="500" fill="#ffffff"/>' +
      currentSigilMarkup +
      "</svg>";

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "hollow-sigil-" + currentSigilData.code + ".svg";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);

    toast("SIGIL SAVED / DO NOT FRAME IT.");
  }

  if (sigilSvg) drawSigil(true);
  if (generateSigilButton) {
    generateSigilButton.addEventListener("click", function () {
      drawSigil(false);
    });
  }
  if (downloadSigilButton) {
    downloadSigilButton.addEventListener("click", downloadSigil);
  }

  /* ------------------------------------------------------------------------
     Frequencies / Web Audio
     ------------------------------------------------------------------------ */

  const channels = [
    {
      name: "LOW MASS",
      hz: "41.2",
      desc: "A room beneath a room.",
      root: 82.4,
      filter: 310,
      lfo: 0.055,
      pan: -0.22
    },
    {
      name: "THE WITNESS",
      hz: "61.7",
      desc: "A microphone that has learned to breathe.",
      root: 123.4,
      filter: 430,
      lfo: 0.072,
      pan: 0.15
    },
    {
      name: "CARRIER (DEAD)",
      hz: "87.1",
      desc: "The sound of a line left open.",
      root: 174.2,
      filter: 560,
      lfo: 0.041,
      pan: -0.1
    },
    {
      name: "WHITE ROOM",
      hz: "33.0",
      desc: "No furniture. No exit.",
      root: 66,
      filter: 220,
      lfo: 0.1,
      pan: 0.2
    }
  ];

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const frequencyPlay = $("#frequencyPlay");
  const frequencyTitle = $("#frequencyTitle");
  const frequencyDesc = $("#frequencyDesc");
  const frequencyNumber = $("#frequencyNumber");
  const frequencySub = $("#frequencySub");
  const frequencyVolume = $("#frequencyVolume");
  const frequencyChannels = $$(".channel");
  const audioFlag = $("#audioFlag");
  const audioFlagFreq = $("#audioFlagFreq");
  const audioFlagStop = $("#audioFlagStop");
  const frequenciesSection = $("#frequencies");
  let frequenciesVisible = false;

  const audio = {
    ctx: null,
    master: null,
    compressor: null,
    impulse: null,
    noiseBuffer: null,
    trackGain: null,
    nodes: [],
    current: 1,
    started: false,
    token: 0
  };

  function volumeToGain(value) {
    return Math.pow(Math.max(0, Math.min(100, value)) / 100, 1.45);
  }

  if (frequencyVolume) {
    frequencyVolume.value = String(
      Math.max(0, Math.min(100, readStoredNumber("hollow_volume", 52)))
    );
  }

  function setSelectedChannel(index) {
    audio.current = index;
    const channel = channels[index];

    frequencyChannels.forEach(function (button, buttonIndex) {
      const selected = buttonIndex === index;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    if (frequencyNumber) frequencyNumber.textContent = channel.hz;
    if (frequencySub) frequencySub.textContent = "CARRIER " + pad(index + 1, 2) + " / " + channel.name;
    if (frequencyTitle) frequencyTitle.textContent = channel.name;
    if (frequencyDesc) frequencyDesc.textContent = channel.desc;
    if (audioFlagFreq) audioFlagFreq.textContent = channel.hz;
  }

  function updateAudioFlag() {
    if (!audioFlag) return;
    const playing = body.classList.contains("is-playing");
    if (frequenciesSection) {
      const rect = frequenciesSection.getBoundingClientRect();
      frequenciesVisible = rect.top < window.innerHeight && rect.bottom > 0;
    }
    audioFlag.hidden = !playing || frequenciesVisible;
  }

  function setAudioUI(playing) {
    body.classList.toggle("is-playing", playing);
    if (frequencyPlay) {
      frequencyPlay.setAttribute(
        "aria-label",
        playing ? "Pause the selected frequency" : "Play the selected frequency"
      );
    }
    updateAudioFlag();
  }

  if (frequenciesSection && "IntersectionObserver" in window) {
    const frequencyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          frequenciesVisible = entry.isIntersecting;
          updateAudioFlag();
        });
      },
      { threshold: 0.08 }
    );
    frequencyObserver.observe(frequenciesSection);
  }

  function createImpulse(context) {
    const seconds = 2.7;
    const decay = 2.3;
    const rate = context.sampleRate;
    const length = Math.floor(rate * seconds);
    const buffer = context.createBuffer(2, length, rate);

    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }

    return buffer;
  }

  function createNoiseBuffer(context) {
    const length = Math.floor(context.sampleRate * 2.4);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function ensureAudio() {
    if (!AudioContextClass) {
      toast("THIS BROWSER DOES NOT SUPPORT WEB AUDIO.");
      return null;
    }

    if (!audio.ctx) {
      try {
        audio.ctx = new AudioContextClass();
      } catch (error) {
        toast("THE AUDIO CHANNEL IS NOT AVAILABLE.");
        return null;
      }

      audio.master = audio.ctx.createGain();
      audio.master.gain.value = volumeToGain(
        frequencyVolume ? Number(frequencyVolume.value) : 52
      );
      audio.compressor = audio.ctx.createDynamicsCompressor();
      audio.compressor.threshold.value = -23;
      audio.compressor.knee.value = 22;
      audio.compressor.ratio.value = 4;
      audio.compressor.attack.value = 0.008;
      audio.compressor.release.value = 0.3;
      audio.master.connect(audio.compressor);
      audio.compressor.connect(audio.ctx.destination);
      audio.impulse = createImpulse(audio.ctx);
      audio.noiseBuffer = createNoiseBuffer(audio.ctx);
    }

    return audio.ctx;
  }

  function stopCurrentChannel(fade) {
    if (!audio.ctx || !audio.trackGain) return;

    const context = audio.ctx;
    const now = context.currentTime;
    const oldGain = audio.trackGain;
    const nodes = audio.nodes;

    oldGain.gain.cancelScheduledValues(now);
    oldGain.gain.setValueAtTime(Math.max(oldGain.gain.value, 0.0001), now);
    oldGain.gain.exponentialRampToValueAtTime(0.0001, now + fade);

    audio.trackGain = null;
    audio.nodes = [];

    window.setTimeout(function () {
      nodes.forEach(function (node) {
        try {
          node.stop();
        } catch (error) {
          /* already stopped */
        }
      });
      try {
        oldGain.disconnect();
      } catch (error) {
        /* already disconnected */
      }
    }, fade * 1000 + 130);
  }

  function buildChannel(channel) {
    const context = audio.ctx;
    const now = context.currentTime;

    const out = context.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(0.88, now + 1.8);

    const dry = context.createGain();
    dry.gain.value = 0.84;
    const wet = context.createGain();
    wet.gain.value = 0.32;
    const reverb = context.createConvolver();
    reverb.buffer = audio.impulse;

    out.connect(dry);
    dry.connect(audio.master);
    out.connect(reverb);
    reverb.connect(wet);
    wet.connect(audio.master);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = channel.filter;
    filter.Q.value = 1.2;

    const panner = context.createStereoPanner
      ? context.createStereoPanner()
      : null;

    if (panner) {
      panner.pan.value = channel.pan;
      filter.connect(panner);
      panner.connect(out);
    } else {
      filter.connect(out);
    }

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.type = "sine";
    lfo.frequency.value = channel.lfo;
    lfoGain.gain.value = channel.filter * 0.38;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(now);

    const nodes = [lfo];

    function addOscillator(type, frequency, level, detune) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = detune || 0;
      gain.gain.value = level;
      oscillator.connect(gain);
      gain.connect(filter);
      oscillator.start(now);
      nodes.push(oscillator);
    }

    addOscillator("sine", channel.root * 0.5, 0.06);
    addOscillator("sine", channel.root, 0.08);
    addOscillator("sine", channel.root * 1.5, 0.026, 4);
    addOscillator("triangle", channel.root * 3.01, 0.012, -5);

    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = audio.noiseBuffer;
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = Math.max(520, channel.filter * 1.75);
    noiseFilter.Q.value = 0.75;
    noiseGain.gain.value = 0.018;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(out);
    noise.start(now);
    nodes.push(noise);

    audio.trackGain = out;
    audio.nodes = nodes;
  }

  async function startChannel(index) {
    const channel = channels[index];
    if (!channel) return;

    const context = ensureAudio();
    if (!context) return;

    const token = ++audio.token;

    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch (error) {
        toast("THE AUDIO CHANNEL IS NOT RESPONDING.");
        return;
      }
    }

    if (token !== audio.token) return;

    stopCurrentChannel(0.7);
    setSelectedChannel(index);
    audio.started = true;
    buildChannel(channel);
    setAudioUI(true);
  }

  async function toggleFrequency() {
    if (!audio.started || !audio.ctx) {
      await startChannel(audio.current);
      return;
    }

    if (body.classList.contains("is-playing")) {
      if (audio.ctx.state === "running") {
        try {
          await audio.ctx.suspend();
        } catch (error) {
          /* The browser may refuse; the interface still reflects intent. */
        }
      }
      setAudioUI(false);
    } else {
      try {
        await audio.ctx.resume();
        setAudioUI(true);
      } catch (error) {
        toast("THE AUDIO CHANNEL IS NOT RESPONDING.");
      }
    }
  }

  function stopFrequency() {
    audio.token += 1;
    stopCurrentChannel(0.3);
    if (audio.ctx && audio.ctx.state === "running") {
      audio.ctx.suspend().catch(function () {});
    }
    audio.started = false;
    setAudioUI(false);
  }

  if (frequencyPlay) {
    frequencyPlay.addEventListener("click", toggleFrequency);
  }

  if (audioFlagStop) {
    audioFlagStop.addEventListener("click", stopFrequency);
  }

  frequencyChannels.forEach(function (button) {
    button.addEventListener("click", function () {
      const index = Number(button.getAttribute("data-channel"));
      if (Number.isNaN(index)) return;
      setSelectedChannel(index);
      if (body.classList.contains("is-playing")) {
        startChannel(index);
      }
    });
  });

  if (frequencyVolume) {
    frequencyVolume.addEventListener("input", function () {
      const value = Number(frequencyVolume.value);
      if (audio.master && audio.ctx) {
        audio.master.gain.setTargetAtTime(
          volumeToGain(value),
          audio.ctx.currentTime,
          0.05
        );
      }
      try {
        window.localStorage.setItem("hollow_volume", String(value));
      } catch (error) {
        /* storage is optional */
      }
    });
  }

  setSelectedChannel(audio.current);

  /* ------------------------------------------------------------------------
     Transmissions
     ------------------------------------------------------------------------ */

  const transmissionMessages = [
    "THE ROOM REMEMBERS A NAME YOU NEVER USED.",
    "DO NOT ANSWER THE SECOND KNOCK.",
    "YOUR REFLECTION HAS BEEN DELAYED BY FOUR SECONDS.",
    "THE MOTH IS NOT A SIGN. IT IS A WITNESS.",
    "WE FOUND THE TAPE. THE TAPE FOUND US.",
    "KEEP THE LIGHT ON. KEEP THE LIGHT ON. KEEP THE LIGHT ON.",
    "THERE IS NO RECORD OF YOUR ARRIVAL.",
    "THE SIGNAL IS PERFECT. THAT IS THE PROBLEM.",
    "SOMEONE IS PRACTICING YOUR HANDWRITING.",
    "BURN THIS AFTER READING. THEN READ IT AGAIN.",
    "THE ARCHIVE IS COMPLETE. YOU ARE NOT IN IT.",
    "A SMALL DOG IS BARKING AT THE BACK OF THE PHOTOGRAPH.",
    "WE HAVE BEEN TRYING TO REACH YOU SINCE 1999.",
    "THE DOOR IS OPEN. IT WAS ALWAYS OPEN.",
    "DO NOT LOOK FOR THE SOURCE. IT IS LOOKING FOR YOU.",
    "THE LAST FRAME IS BLANK. THE LAST FRAME IS NOT BLANK.",
    "YOUR VOICE ARRIVED BEFORE YOU DID.",
    "THE HOUSE HAS NO ROOMS. THE ROOMS HAVE A HOUSE.",
    "THIS MESSAGE WILL SELF-DESTRUCT WHEN YOU UNDERSTAND IT.",
    "NO FURTHER INSTRUCTIONS. CONTINUE AS BEFORE."
  ];

  const receiveButton = $("#receiveButton");
  const transmissionMessage = $("#transmissionMessage");
  const transmissionCode = $("#transmissionCode");
  const transmissionTime = $("#transmissionTime");
  const transmissionLog = $("#transmissionLog");
  const signalStrength = $("#signalStrength");
  const scrambleCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789—/";

  let lastTransmissionIndex = -1;
  let receiving = false;
  let transmissionTimer = null;

  function formatTime(date) {
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  }

  function makeTransmissionCode() {
    return (
      "TX—" +
      pad(randomInt(0, 9999), 4) +
      "-" +
      String.fromCharCode(65 + randomInt(0, 25))
    );
  }

  function updateSignalStrength() {
    if (!signalStrength) return;
    const strength = randomInt(31, 98);
    signalStrength.style.background =
      "linear-gradient(to right, #b00000 0 " +
      strength +
      "%, rgba(255, 255, 255, 0.18) " +
      strength +
      "%)";
  }

  function addTransmissionLog(text, code, time) {
    if (!transmissionLog) return;

    const empty = transmissionLog.querySelector(".log-empty");
    if (empty) empty.remove();

    const item = document.createElement("li");
    item.className = "is-new";

    const meta = document.createElement("div");
    meta.className = "log-entry__meta";
    const codeSpan = document.createElement("span");
    codeSpan.textContent = code;
    const timeSpan = document.createElement("span");
    timeSpan.textContent = time;
    meta.appendChild(codeSpan);
    meta.appendChild(timeSpan);

    const message = document.createElement("p");
    message.textContent = text;

    item.appendChild(meta);
    item.appendChild(message);
    transmissionLog.prepend(item);

    while (transmissionLog.children.length > 3) {
      transmissionLog.removeChild(transmissionLog.lastElementChild);
    }
  }

  function typeTransmission(text, onComplete) {
    const totalFrames = text.length + 10;
    let frame = 0;

    if (transmissionTimer) window.clearInterval(transmissionTimer);

    transmissionTimer = window.setInterval(function () {
      frame += 1;
      const revealed = Math.floor((frame / totalFrames) * text.length);

      let output = "";
      for (let i = 0; i < text.length; i += 1) {
        const character = text.charAt(i);
        if (character === "\n" || character === " ") {
          output += character;
        } else if (i < revealed) {
          output += character;
        } else if (Math.random() < 0.44) {
          output += scrambleCharacters.charAt(randomInt(0, scrambleCharacters.length - 1));
        } else {
          output += character;
        }
      }

      if (transmissionMessage) transmissionMessage.textContent = output;

      if (frame >= totalFrames) {
        window.clearInterval(transmissionTimer);
        transmissionTimer = null;
        if (transmissionMessage) transmissionMessage.textContent = text;
        onComplete();
      }
    }, 26);
  }

  function receiveTransmission() {
    if (receiving || !transmissionMessage || !receiveButton) return;
    receiving = true;
    receiveButton.disabled = true;
    receiveButton.setAttribute("aria-busy", "true");
    receiveButton.querySelector(".action-link__label").textContent = "RECEIVING...";

    let index = randomInt(0, transmissionMessages.length - 1);
    while (index === lastTransmissionIndex) {
      index = randomInt(0, transmissionMessages.length - 1);
    }
    lastTransmissionIndex = index;
    const message = transmissionMessages[index];
    const code = makeTransmissionCode();
    const now = new Date();
    const time = formatTime(now);

    if (transmissionCode) transmissionCode.textContent = code;
    if (transmissionTime) transmissionTime.textContent = time;
    updateSignalStrength();

    transmissionMessage.setAttribute("aria-live", "off");
    transmissionMessage.classList.add("is-typing");

    function finish() {
      transmissionMessage.setAttribute("aria-live", "polite");
      transmissionMessage.textContent = message;
      transmissionMessage.classList.remove("is-typing");
      addTransmissionLog(message, code, time);
      receiving = false;
      receiveButton.disabled = false;
      receiveButton.removeAttribute("aria-busy");
      receiveButton.querySelector(".action-link__label").textContent = "RECEIVE TRANSMISSION";
      toast("TRANSMISSION RECEIVED / DO NOT REPLY.");
    }

    if (reducedMotion) {
      transmissionMessage.textContent = message;
      window.setTimeout(finish, 80);
    } else {
      typeTransmission(message, finish);
    }
  }

  if (receiveButton) {
    receiveButton.addEventListener("click", receiveTransmission);
  }

  /* ------------------------------------------------------------------------
     Appendix A / residue reader
     ------------------------------------------------------------------------ */

  const relics = {
    capsule: {
      no: "REL. 01 / THE UNLABELED CAPSULE",
      title: "THE UNLABELED CAPSULE",
      ref: "RESIDUE OF: THE MATRIX (1999)",
      img: "assets/img/relic-capsule.webp",
      alt: "An amber capsule held between two fingers, photographed as residue.",
      text:
        "A red object with no instructions. The choice was never between two objects; it was between two versions of the room. We kept the capsule. The room stayed."
    },
    cake: {
      no: "REL. 02 / THE CAKE (A LIE)",
      title: "THE CAKE (A LIE)",
      ref: "RESIDUE OF: PORTAL (2007)",
      img: "assets/img/relic-cake.webp",
      alt: "A slice of layered chocolate cake on a plate with chocolate sauce.",
      text:
        "The cake was promised. The cake was not delivered. The recipe survived, but every ingredient has been replaced by a recorded voice."
    },
    monolith: {
      no: "REL. 03 / THE MONOLITH (CHIPPED)",
      title: "THE MONOLITH (CHIPPED)",
      ref: "RESIDUE OF: 2001: A SPACE ODYSSEY (1968)",
      img: "assets/img/relic-monolith.webp",
      alt: "An engraved obelisk at Axum, standing on its base.",
      text:
        "It was already there when the room arrived. We built the wall around it and called the wall history."
    },
    balloon: {
      no: "REL. 04 / THE RED BALLOON",
      title: "THE RED BALLOON",
      ref: "RESIDUE OF: IT (1986 / 2017)",
      img: "assets/img/relic-balloon.webp",
      alt: "A red balloon painted on a pale brick wall, its string curling downward.",
      text:
        "It came up through the storm drain. The drain was not connected to anything. The balloon was."
    },
    rabbit: {
      no: "REL. 05 / THE WHITE RABBIT",
      title: "THE WHITE RABBIT",
      ref: "RESIDUE OF: ALICE IN WONDERLAND (1865)",
      img: "assets/img/relic-rabbit.webp",
      alt: "John Tenniel’s White Rabbit in a checked coat, holding a watch.",
      text:
        "The rabbit is late. The watch is wrong. The hole is exactly where you are standing."
    },
    channel: {
      no: "REL. 06 / THE DEAD CHANNEL",
      title: "THE DEAD CHANNEL",
      ref: "RESIDUE OF: NEUROMANCER (1984)",
      img: "assets/img/relic-channel.webp",
      alt: "A CRT test card dissolving into static, labeled NO SIGNAL.",
      text:
        "The sky was the colour of a dead channel. We kept watching. Somewhere behind the static, a weather report was still being written."
    },
    redroom: {
      no: "REL. 07 / THE RED ROOM",
      title: "THE RED ROOM",
      ref: "RESIDUE OF: TWIN PEAKS (1990)",
      img: "assets/img/relic-redroom.webp",
      alt: "Anna Ancher’s red interior, a girl seated by a sunlit window.",
      text:
        "A red room with a chevron floor. The curtain opens on the same conversation from a different year. Nobody remembers arriving. Everybody remembers the coffee."
    },
    vhs: {
      no: "REL. 08 / THE VHS TAPE",
      title: "THE VHS TAPE",
      ref: "RESIDUE OF: RINGU (1998)",
      img: "assets/img/relic-vhs.webp",
      alt: "A black VHS cassette, its reels visible through the window.",
      text:
        "A tape with no label. Seven days is a generous estimate. The static has been paused for thirty years and it is still moving."
    },
    mirror: {
      no: "REL. 09 / THE BLACK MIRROR",
      title: "THE BLACK MIRROR",
      ref: "RESIDUE OF: BLACK MIRROR (2011)",
      img: "assets/img/relic-mirror.webp",
      alt: "A dark obsidian mirror with a polished, reflective face.",
      text:
        "A black screen that knows your face. The reflection is delayed by one decision. By the time you recognize yourself, the next episode has already been renewed."
    }
  };

  const relicOrder = ["capsule", "cake", "monolith", "balloon", "rabbit", "channel", "redroom", "vhs", "mirror"];
  let currentRelicIndex = 0;
  let lastRelicTrigger = null;

  const relicDialogImage = $("#relicDialogImage");
  const relicDialogNo = $("#relicDialogNo");
  const relicDialogRef = $("#relicDialogRef");
  const relicDialogTitle = $("#relicDialogTitle");
  const relicDialogText = $("#relicDialogText");
  const relicClose = $("#relicClose");
  const relicPrev = $("#relicPrev");
  const relicNext = $("#relicNext");

  function renderRelic(index) {
    const data = relics[relicOrder[index]];
    if (!data) return;

    currentRelicIndex = index;

    if (relicDialogImage) {
      relicDialogImage.src = data.img;
      relicDialogImage.alt = data.alt;
    }
    if (relicDialogNo) relicDialogNo.textContent = "APPENDIX A / " + data.no;
    if (relicDialogRef) relicDialogRef.textContent = data.ref;
    if (relicDialogTitle) relicDialogTitle.textContent = data.title;
    if (relicDialogText) relicDialogText.textContent = data.text;
  }

  function openRelic(key, trigger) {
    if (!relicDialog || relicDialog.open) return;
    const index = relicOrder.indexOf(key);
    if (index < 0) return;

    playSfx("static");
    lastRelicTrigger = trigger || null;
    renderRelic(index);

    if (typeof relicDialog.showModal === "function") {
      relicDialog.showModal();
    } else {
      relicDialog.setAttribute("open", "");
    }

    syncModalState();
  }

  function closeRelic() {
    if (!relicDialog) return;
    if (typeof relicDialog.close === "function") {
      relicDialog.close();
    } else {
      relicDialog.removeAttribute("open");
      if (lastRelicTrigger) lastRelicTrigger.focus();
    }
    syncModalState();
  }

  $$("[data-relic]").forEach(function (button) {
    button.addEventListener("click", function () {
      openRelic(button.getAttribute("data-relic"), button);
    });
  });

  if (relicClose) relicClose.addEventListener("click", closeRelic);

  if (relicPrev) {
    relicPrev.addEventListener("click", function () {
      renderRelic((currentRelicIndex - 1 + relicOrder.length) % relicOrder.length);
    });
  }

  if (relicNext) {
    relicNext.addEventListener("click", function () {
      renderRelic((currentRelicIndex + 1) % relicOrder.length);
    });
  }

  if (relicDialog) {
    relicDialog.addEventListener("close", function () {
      syncModalState();
      if (lastRelicTrigger) lastRelicTrigger.focus();
    });

    relicDialog.addEventListener("click", function (event) {
      if (event.target === relicDialog) closeRelic();
    });
  }

  /* ------------------------------------------------------------------------
     Appendix B / map room
     ------------------------------------------------------------------------ */

  const mapNodes = {
    north: {
      no: "APPENDIX B / FIELD NOTE 01",
      title: "NORTH STATION",
      meta: "58°17′N / 03°04′W / 61.7 HZ",
      text:
        "The station is closed. The transmitter is not. Someone left the heater on and the door open, which is how we know the signal is still inside."
    },
    cut: {
      no: "APPENDIX B / FIELD NOTE 02",
      title: "THE CUT",
      meta: "57°51′N / 02°12′W / 49.3 HZ",
      text:
        "A channel cut through the chart to make the crossing shorter. The crossing is shorter. The map is now wrong in a way that feels intentional."
    },
    witness: {
      no: "APPENDIX B / FIELD NOTE 03",
      title: "WITNESS ROCK",
      meta: "56°44′N / 04°08′W / 33.0 HZ",
      text:
        "A rock with a clear view of the water and no view of the shore. Whoever named it was not describing the rock. They were describing the job."
    },
    lowtide: {
      no: "APPENDIX B / FIELD NOTE 04",
      title: "LOW TIDE",
      meta: "55°19′N / 05°21′W / 22.4 HZ",
      text:
        "At low tide you can walk to the next island. At high tide the island is a rumour. The route on this map was drawn at the wrong hour on purpose."
    },
    dead: {
      no: "APPENDIX B / FIELD NOTE 05",
      title: "DEAD CHANNEL",
      meta: "54°02′N / 01°44′W / 87.6 HZ",
      text:
        "The water here receives nothing and gives nothing back. The echo is clean. That is how the channel got its name and how it kept it."
    },
    hollow: {
      no: "APPENDIX B / FIELD NOTE 06",
      title: "THE HOLLOW",
      meta: "53°33′N / 06°17′W / 00.0 HZ",
      text:
        "The centre of the map is not a place. It is the part of the route that was left out. Follow the red line until it stops being a line."
    }
  };

  const mapOrder = ["north", "cut", "witness", "lowtide", "dead", "hollow"];
  let currentMapIndex = 0;

  const mapPanelNo = $("#mapPanelNo");
  const mapPanelTitle = $("#mapPanelTitle");
  const mapPanelMeta = $("#mapPanelMeta");
  const mapPanelText = $("#mapPanelText");
  const mapPins = $$("[data-map]");
  const mapTrace = $("#mapTrace");

  function renderMap(index) {
    const data = mapNodes[mapOrder[index]];
    if (!data) return;

    currentMapIndex = index;

    if (mapPanelNo) mapPanelNo.textContent = data.no;
    if (mapPanelTitle) mapPanelTitle.textContent = data.title;
    if (mapPanelMeta) mapPanelMeta.textContent = data.meta;
    if (mapPanelText) mapPanelText.textContent = data.text;

    mapPins.forEach(function (button) {
      const active = button.getAttribute("data-map") === mapOrder[index];
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  mapPins.forEach(function (button) {
    button.addEventListener("click", function () {
      renderMap(mapOrder.indexOf(button.getAttribute("data-map")));
      playSfx("ping");
    });
  });

  if (mapTrace) {
    mapTrace.addEventListener("click", function () {
      renderMap((currentMapIndex + 1) % mapOrder.length);
      playSfx("ping");
    });
  }

  renderMap(0);

  const mapRoom = $("#map-room");
  const mapFrame = $(".map-room__frame");
  const blueRouteToggle = $("#blueRouteToggle");
  const blueRouteLabel = blueRouteToggle
    ? blueRouteToggle.querySelector(".blue-route__toggle-label")
    : null;

  function setBlueRoute(on) {
    if (!mapRoom || !blueRouteToggle) return;
    mapRoom.classList.toggle("is-blue", on);
    blueRouteToggle.setAttribute("aria-pressed", String(on));
    if (blueRouteLabel) {
      blueRouteLabel.textContent = on ? "BLUE ROUTE ON" : "TRACE THE BLUE ROUTE";
    }

    if (on && mapFrame) {
      mapFrame.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "center"
      });
    }
  }

  if (blueRouteToggle) {
    blueRouteToggle.addEventListener("click", function () {
      setBlueRoute(!mapRoom.classList.contains("is-blue"));
      playSfx("draw");
    });
  }

  /* ------------------------------------------------------------------------
     Text cut-up
     ------------------------------------------------------------------------ */

  const cutupBtn = $("#cutupBtn");
  const cutupOut = $("#cutupOut");
  const cutupCount = $("#cutupCount");

  const cutupOpeners = [
    "I stopped trusting the sky",
    "The room was empty",
    "Every archive is",
    "We mistook the hum for",
    "The microphone kept",
    "The line was open"
  ];
  const cutupMiddles = [
    "a haunted house",
    "a second shadow",
    "a borrowed voice",
    "a room beneath a room",
    "a door left open",
    "a clean signal"
  ];
  const cutupEndings = [
    "and nobody answered.",
    "so we kept listening.",
    "but the tape kept running.",
    "and the room kept breathing.",
    "until the signal went out.",
    "and the order was not the point."
  ];

  let cutupMoves = 0;
  let cutupTimer = null;

  function typeCutup(text) {
    if (!cutupOut) return;

    if (cutupTimer) {
      window.clearInterval(cutupTimer);
      cutupTimer = null;
    }

    if (reducedMotion) {
      cutupOut.textContent = text;
      cutupOut.setAttribute("aria-live", "polite");
      return;
    }

    cutupOut.setAttribute("aria-live", "off");
    cutupOut.textContent = "";
    let index = 0;

    cutupTimer = window.setInterval(function () {
      index += 1;
      cutupOut.textContent = text.slice(0, index);

      if (index >= text.length) {
        window.clearInterval(cutupTimer);
        cutupTimer = null;
        cutupOut.setAttribute("aria-live", "polite");
      }
    }, 17);
  }

  function makeCutup() {
    if (!cutupOut || !cutupBtn) return;

    const opener = cutupOpeners[randomInt(0, cutupOpeners.length - 1)];
    const middle = cutupMiddles[randomInt(0, cutupMiddles.length - 1)];
    const ending = cutupEndings[randomInt(0, cutupEndings.length - 1)];
    let text = opener + " " + middle + " " + ending;

    cutupMoves += 1;

    if (cutupCount) cutupCount.textContent = "CUT " + pad(cutupMoves, 3);

    if (cutupMoves === 3) {
      text += " The blade is warm.";
    } else if (cutupMoves === 7) {
      text += " Stop cutting. It is already a sentence.";
    }

    playSfx("stamp");
    typeCutup(text);
  }

  if (cutupBtn) {
    cutupBtn.addEventListener("click", makeCutup);
  }

  /* ------------------------------------------------------------------------
     Room tone
     ------------------------------------------------------------------------ */

  const toneToggle = $("#toneToggle");
  const toneLabel = toneToggle ? toneToggle.querySelector(".tone-toggle__label") : null;

  const roomTone = {
    ctx: null,
    master: null,
    nodes: [],
    on: false,
    timer: null
  };

  function updateToneUI() {
    if (!toneToggle) return;
    toneToggle.classList.toggle("is-on", roomTone.on);
    toneToggle.setAttribute("aria-pressed", String(roomTone.on));
    toneToggle.setAttribute(
      "aria-label",
      roomTone.on ? "Turn room tone off" : "Turn room tone on"
    );
    if (toneLabel) toneLabel.textContent = roomTone.on ? "ROOM TONE ON" : "ROOM TONE";
  }

  function createRoomTone() {
    if (!AudioContextClass) return false;
    if (roomTone.ctx) return true;

    const ctx = new AudioContextClass();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();

    master.gain.value = 0;
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 5;
    compressor.attack.value = 0.02;
    compressor.release.value = 0.4;

    master.connect(compressor);
    compressor.connect(ctx.destination);

    const oscillatorA = ctx.createOscillator();
    const oscillatorB = ctx.createOscillator();
    oscillatorA.type = "sine";
    oscillatorA.frequency.value = 55;
    oscillatorB.type = "triangle";
    oscillatorB.frequency.value = 61.7;

    const gainA = ctx.createGain();
    const gainB = ctx.createGain();
    gainA.gain.value = 0.045;
    gainB.gain.value = 0.018;

    oscillatorA.connect(gainA);
    oscillatorB.connect(gainB);
    gainA.connect(master);
    gainB.connect(master);

    const length = Math.floor(ctx.sampleRate * 3);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.018 * white) / 1.018;
      data[i] = last * 2.8;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.value = 240;
    noiseFilter.Q.value = 0.6;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.028;

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(master);

    oscillatorA.start();
    oscillatorB.start();
    noise.start();

    roomTone.ctx = ctx;
    roomTone.master = master;
    roomTone.nodes = [oscillatorA, oscillatorB, noise, gainA, gainB, noiseFilter, noiseGain, compressor];

    return true;
  }

  function startRoomTone() {
    if (!createRoomTone() || !roomTone.ctx || !roomTone.master) return;

    if (roomTone.timer) {
      window.clearTimeout(roomTone.timer);
      roomTone.timer = null;
    }

    const ctx = roomTone.ctx;
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    roomTone.master.gain.cancelScheduledValues(now);
    roomTone.master.gain.setValueAtTime(Math.max(0.0001, roomTone.master.gain.value), now);
    roomTone.master.gain.linearRampToValueAtTime(0.72, now + 1.4);

    roomTone.on = true;
    updateToneUI();
  }

  function stopRoomTone() {
    if (!roomTone.ctx || !roomTone.master) {
      roomTone.on = false;
      updateToneUI();
      return;
    }

    const ctx = roomTone.ctx;
    const now = ctx.currentTime;
    roomTone.master.gain.cancelScheduledValues(now);
    roomTone.master.gain.setValueAtTime(roomTone.master.gain.value, now);
    roomTone.master.gain.linearRampToValueAtTime(0.0001, now + 0.55);

    roomTone.on = false;
    updateToneUI();

    roomTone.timer = window.setTimeout(function () {
      if (!roomTone.on && roomTone.ctx && roomTone.ctx.state === "running") {
        roomTone.ctx.suspend();
      }
    }, 700);
  }

  function toggleRoomTone() {
    if (roomTone.on) {
      stopRoomTone();
    } else {
      startRoomTone();
    }
  }

  if (toneToggle) {
    if (!AudioContextClass) {
      toneToggle.disabled = true;
      toneToggle.setAttribute("aria-label", "Room tone unavailable in this browser");
    } else {
      toneToggle.addEventListener("click", toggleRoomTone);
    }
  }

  document.addEventListener("keydown", function (event) {
    const tag = document.activeElement ? document.activeElement.tagName : "";
    const editing = /INPUT|TEXTAREA|SELECT/.test(tag);
    const hasModifier = event.metaKey || event.ctrlKey || event.altKey;
    const modalOpen = Boolean(
      (indexDialog && indexDialog.open) ||
        (plateDialog && plateDialog.open) ||
        (relicDialog && relicDialog.open)
    );

    if (
      event.key.toLowerCase() === "s" &&
      !editing &&
      !hasModifier &&
      !modalOpen
    ) {
      event.preventDefault();
      toggleRoomTone();
    }

    if (
      event.key.toLowerCase() === "f" &&
      !editing &&
      !hasModifier
    ) {
      event.preventDefault();
      toggleSfx();
    }
  });

  /* ------------------------------------------------------------------------
     Interface sounds
     ------------------------------------------------------------------------ */

  const sfxToggle = $("#sfxToggle");
  const sfx = {
    ctx: null,
    noise: null
  };
  let sfxEnabled = true;

  function ensureSfxContext() {
    if (!AudioContextClass) return null;
    if (!sfx.ctx) {
      sfx.ctx = new AudioContextClass();
    }
    if (sfx.ctx.state === "suspended") {
      sfx.ctx.resume();
    }
    return sfx.ctx;
  }

  function getSfxNoise(ctx) {
    if (sfx.noise) return sfx.noise;

    const length = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;

    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 4;
    }

    sfx.noise = buffer;
    return buffer;
  }

  function sfxGain(ctx, peak, duration) {
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    gain.connect(ctx.destination);
    return { gain: gain, start: now, end: now + duration + 0.03 };
  }

  function playSfx(kind) {
    if (!sfxEnabled) return;
    const ctx = ensureSfxContext();
    if (!ctx) return;

    if (kind === "paper") {
      const source = ctx.createBufferSource();
      source.buffer = getSfxNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 900;
      const envelope = sfxGain(ctx, 0.045, 0.11);
      source.connect(filter);
      filter.connect(envelope.gain);
      source.start(envelope.start);
      source.stop(envelope.end);
    } else if (kind === "static") {
      const source = ctx.createBufferSource();
      source.buffer = getSfxNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1100;
      filter.Q.value = 0.7;
      const envelope = sfxGain(ctx, 0.035, 0.19);
      source.connect(filter);
      filter.connect(envelope.gain);
      source.start(envelope.start);
      source.stop(envelope.end);
    } else if (kind === "projector") {
      const source = ctx.createBufferSource();
      source.buffer = getSfxNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 620;
      const envelope = sfxGain(ctx, 0.03, 1.15);
      source.connect(filter);
      filter.connect(envelope.gain);
      source.start(envelope.start);
      source.stop(envelope.end);

      const motor = ctx.createOscillator();
      motor.type = "sawtooth";
      motor.frequency.value = 74;
      const motorGain = ctx.createGain();
      motorGain.gain.value = 0.008;
      motor.connect(motorGain);
      motorGain.connect(envelope.gain);
      motor.start(envelope.start);
      motor.stop(envelope.end);
    } else if (kind === "ping") {
      const envelope = sfxGain(ctx, 0.035, 0.2);
      [880, 1320].forEach(function (frequency, index) {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        const gain = ctx.createGain();
        gain.gain.value = index === 0 ? 0.55 : 0.2;
        oscillator.connect(gain);
        gain.connect(envelope.gain);
        oscillator.start(envelope.start);
        oscillator.stop(envelope.end);
      });
    } else if (kind === "stamp") {
      const envelope = sfxGain(ctx, 0.07, 0.17);
      const oscillator = ctx.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(92, envelope.start);
      oscillator.frequency.exponentialRampToValueAtTime(54, envelope.start + 0.12);
      oscillator.connect(envelope.gain);
      oscillator.start(envelope.start);
      oscillator.stop(envelope.end);

      const source = ctx.createBufferSource();
      source.buffer = getSfxNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 600;
      source.connect(filter);
      filter.connect(envelope.gain);
      source.start(envelope.start);
      source.stop(envelope.end);
    } else if (kind === "draw") {
      const source = ctx.createBufferSource();
      source.buffer = getSfxNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.34);
      const envelope = sfxGain(ctx, 0.03, 0.36);
      source.connect(filter);
      filter.connect(envelope.gain);
      source.start(envelope.start);
      source.stop(envelope.end);
    }
  }

  function updateSfxUI() {
    if (!sfxToggle) return;
    sfxToggle.setAttribute("aria-pressed", String(sfxEnabled));
    sfxToggle.textContent = sfxEnabled ? "SOUND FX: ON" : "SOUND FX: OFF";
  }

  function toggleSfx() {
    if (!AudioContextClass) return;
    sfxEnabled = !sfxEnabled;
    updateSfxUI();
    if (sfxEnabled) {
      playSfx("ping");
      if (typeof toast === "function") toast("INTERFACE SOUNDS ON.");
    } else if (typeof toast === "function") {
      toast("INTERFACE SOUNDS OFF.");
    }
  }

  if (sfxToggle) {
    if (!AudioContextClass) {
      sfxEnabled = false;
      sfxToggle.disabled = true;
      sfxToggle.textContent = "SOUND FX: UNAVAILABLE";
    } else {
      sfxToggle.addEventListener("click", toggleSfx);
    }
    updateSfxUI();
  }

  /* ------------------------------------------------------------------------
     Appendix C / the lost reel
     ------------------------------------------------------------------------ */

  const lostReel = $(".lost-reel");
  const filmStrip = $("#filmStrip");
  const filmFrames = $$(".film-frame");
  const lostReelPlay = $("#lostReelPlay");
  const lostReelStatus = $("#lostReelStatus");
  let reelIndex = 0;
  let reelTimer = null;
  let reelPlaying = false;
  let reelFinished = false;

  function readFrame(frame) {
    const caption = frame ? frame.querySelector("figcaption") : null;
    const labels = caption ? Array.from(caption.querySelectorAll("span")) : [];
    return {
      frame: labels[0] ? labels[0].textContent : "FRAME --",
      time: labels[1] ? labels[1].textContent : "--:--:--:--",
      missing: Boolean(frame && frame.classList.contains("film-frame--missing"))
    };
  }

  function setReelFrame(index, scrollIntoView) {
    if (!filmFrames.length) return;
    const safe = Math.max(0, Math.min(index, filmFrames.length - 1));
    reelIndex = safe;

    filmFrames.forEach(function (frame, frameIndex) {
      frame.classList.toggle("is-active", frameIndex === safe);
      frame.classList.toggle("is-past", frameIndex < safe);
    });

    const data = readFrame(filmFrames[safe]);
    if (lostReelStatus) {
      lostReelStatus.textContent =
        data.frame + " / " + data.time + (data.missing ? " / MISSING" : "");
    }

    if (scrollIntoView && filmStrip) {
      const frame = filmFrames[safe];
      const left = frame.offsetLeft - (filmStrip.clientWidth - frame.clientWidth) / 2;
      filmStrip.scrollTo({
        left: Math.max(0, left),
        behavior: motionLite || reducedMotion ? "auto" : "smooth"
      });
    }
  }

  function stopReel(finished) {
    reelPlaying = false;
    window.clearTimeout(reelTimer);
    reelTimer = null;
    if (lostReel) lostReel.classList.remove("is-playing");
    if (lostReelPlay) {
      lostReelPlay.setAttribute("aria-pressed", "false");
      lostReelPlay.innerHTML = (finished ? "REWIND THE REEL" : "RUN THE LOST REEL") +
        ' <span aria-hidden="true">↯</span>';
    }
    if (lostReelStatus) lostReelStatus.setAttribute("aria-live", "polite");
    if (finished) {
      reelFinished = true;
      if (lostReelStatus) lostReelStatus.textContent = "END OF REEL / 2 FRAMES MISSING";
    }
  }

  function advanceReel() {
    if (!reelPlaying) return;
    reelTimer = window.setTimeout(function () {
      if (!reelPlaying) return;
      const next = reelIndex + 1;
      if (next >= filmFrames.length) {
        stopReel(true);
        return;
      }
      setReelFrame(next, true);
      advanceReel();
    }, motionLite ? 1120 : 860);
  }

  function startReel() {
    if (!filmFrames.length) return;

    if (reelPlaying) {
      stopReel(false);
      return;
    }

    if (reelFinished) {
      reelFinished = false;
      setReelFrame(0, true);
    }

    filmFrames.forEach(function (frame) {
      const image = frame.querySelector("img");
      if (!image) return;
      image.loading = "eager";
      if (typeof image.decode === "function") image.decode().catch(function () {});
    });

    reelPlaying = true;
    if (lostReel) lostReel.classList.add("is-playing");
    if (lostReelStatus) lostReelStatus.setAttribute("aria-live", "off");
    if (lostReelPlay) {
      lostReelPlay.setAttribute("aria-pressed", "true");
      lostReelPlay.innerHTML = 'STOP THE REEL <span aria-hidden="true">×</span>';
    }
    playSfx("projector");
    advanceReel();
  }

  filmFrames.forEach(function (frame, index) {
    frame.addEventListener("click", function () {
      if (reelPlaying) stopReel(false);
      setReelFrame(index, true);
    });

    frame.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (reelPlaying) stopReel(false);
      setReelFrame(index, true);
    });
  });

  if (lostReelPlay) {
    lostReelPlay.addEventListener("click", startReel);
  }

  setReelFrame(0, false);

  /* ------------------------------------------------------------------------
     Initial state
     ------------------------------------------------------------------------ */

  renderPlate(0);
})();

