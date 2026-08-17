/* FORMADOS — wizard de inscripción de 4 pasos.
   Envía a POST /api/inscripcion. Deja ENDPOINT igual para producción;
   si el fetch falla, se ofrece WhatsApp como alternativa. */
(function () {
  var ENDPOINT = "/api/inscripcion";
  var WHATSAPP_FALLBACK = "https://wa.me/18095550100"; // TODO: reemplazar con el número real de contacto

  var sheet = document.getElementById("sheet");
  if (!sheet) return;

  var panes = [].slice.call(document.querySelectorAll(".f-pane"));
  var railButtons = [].slice.call(document.querySelectorAll("#rail button"));
  var people = document.getElementById("people");
  var paso = 0;
  var seq = 0;

  function pistaDe(edad) {
    if (edad < 12) return "Kids";
    if (edad < 18) return "Next Gen";
    return "Adultos";
  }

  function marca(el, errId, ok) {
    if (!el) return ok;
    el.setAttribute("aria-invalid", ok ? "false" : "true");
    var e = errId ? document.getElementById(errId) : el.parentElement.querySelector(".f-err");
    if (e) e.classList.toggle("on", !ok);
    return ok;
  }

  function grupoOk(name, errId) {
    var ok = !!document.querySelector('input[name=' + name + ']:checked');
    var e = document.getElementById(errId);
    if (e) e.classList.toggle("on", !ok);
    return ok;
  }

  function valida(n) {
    var ok = true;
    var v = function (id) { return document.getElementById(id); };

    if (n === 0) {
      ok = marca(v("nombre"), "e-nombre", v("nombre").value.trim().length > 2) && ok;
      ok = marca(v("whatsapp"), "e-whatsapp", v("whatsapp").value.replace(/\D/g, "").length >= 10) && ok;
      var ed = parseInt(v("edad").value, 10);
      ok = marca(v("edad"), "e-edad", ed >= 6 && ed <= 110) && ok;
      ok = marca(v("correo"), "e-correo", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("correo").value.trim())) && ok;
      ok = marca(v("sector"), "e-sector", !!v("sector").value) && ok;
      ok = grupoOk("primera", "e-primera") && ok;
    }
    if (n === 1) {
      [].slice.call(people.children).forEach(function (p) {
        var nm = p.querySelector(".p-nombre"), ed = p.querySelector(".p-edad"),
          rt = p.querySelector(".p-retira"), esMenor = p.querySelector(".f-person-minor").classList.contains("on");
        ok = marca(nm, null, nm.value.trim().length > 2) && ok;
        var e = parseInt(ed.value, 10);
        ok = marca(ed, null, e >= 1 && e <= 110) && ok;
        if (esMenor) ok = marca(rt, null, rt.value.trim().length > 2) && ok;
      });
    }
    if (!ok) {
      var bad = panes[n].querySelector('[aria-invalid="true"], .f-err.on');
      if (bad) bad.scrollIntoView({ block: "center" });
    }
    return ok;
  }

  function ir(n, opts) {
    opts = opts || {};
    if (n > paso && !opts.skipValidation && !valida(paso)) return;
    paso = n;
    panes.forEach(function (p, i) { p.classList.toggle("on", i === n); });
    railButtons.forEach(function (b, i) {
      b.classList.toggle("done", i < n);
      if (i === n) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
    if (n === 3) resumen();
    if (!opts.fromHash) {
      history.pushState({ paso: n }, "", "#paso-" + n);
    }
    sheet.scrollIntoView({ block: "start" });
  }

  [].slice.call(document.querySelectorAll("[data-go]")).forEach(function (b) {
    b.addEventListener("click", function () { ir(parseInt(b.dataset.go, 10)); });
  });

  window.addEventListener("popstate", function (e) {
    var n = e.state && typeof e.state.paso === "number" ? e.state.paso : 0;
    ir(n, { skipValidation: true, fromHash: true });
  });

  var initialHash = (location.hash || "").match(/paso-(\d)/);
  if (initialHash) {
    var n0 = Math.min(parseInt(initialHash[1], 10), panes.length - 1);
    if (n0 > 0) ir(n0, { skipValidation: true, fromHash: true });
  }

  /* ── personas ── */
  function agregar() {
    var id = ++seq;
    var d = document.createElement("div");
    d.className = "f-person";
    d.dataset.id = id;
    d.innerHTML =
      '<div class="f-person-head"><span class="f-person-who">Persona ' + (people.children.length + 1) + '</span>' +
      '<button type="button" class="f-person-drop">Quitar</button></div>' +
      '<div class="f-row">' +
      '<div class="f-field"><label>Nombre completo</label>' +
      '<input type="text" class="p-nombre" required />' +
      '<p class="f-err">Escribe el nombre.</p></div>' +
      '<div class="f-field"><label>Edad</label>' +
      '<input type="number" class="p-edad" min="1" max="110" inputmode="numeric" required />' +
      '<p class="f-err">Escribe la edad.</p>' +
      '<span class="f-person-pista"></span></div>' +
      '</div>' +
      '<div class="f-person-minor">' +
      '<div class="f-field"><label>¿Quién lo retira al terminar?</label>' +
      '<span class="f-hint">Nombre de la persona autorizada. Si son varias, escríbelas todas.</span>' +
      '<input type="text" class="p-retira" required />' +
      '<p class="f-err">Necesitamos saber quién lo retira.</p></div>' +
      '<div class="f-field"><label>Alergias o algo que debamos saber</label>' +
      '<span class="f-hint">Si no aplica, escribe "Ninguna".</span>' +
      '<input type="text" class="p-alergias" /></div>' +
      '</div>';
    people.appendChild(d);

    var edad = d.querySelector(".p-edad"), chip = d.querySelector(".f-person-pista"), minor = d.querySelector(".f-person-minor");
    edad.addEventListener("input", function () {
      var v = parseInt(edad.value, 10);
      if (v > 0) {
        chip.textContent = "Pista · " + pistaDe(v);
        chip.style.display = "inline-block";
      } else {
        chip.style.display = "none";
      }
      minor.classList.toggle("on", v > 0 && v < 18);
    });
    d.querySelector(".f-person-drop").addEventListener("click", function () {
      d.remove();
      renumerar();
    });
    d.querySelector(".p-nombre").focus();
  }

  function renumerar() {
    [].slice.call(people.children).forEach(function (p, i) {
      p.querySelector(".f-person-who").textContent = "Persona " + (i + 1);
    });
  }

  var addBtn = document.getElementById("addPerson");
  if (addBtn) addBtn.addEventListener("click", agregar);

  /* ── resumen ── */
  function personas() {
    var lista = [{
      nombre: document.getElementById("nombre").value.trim(),
      edad: parseInt(document.getElementById("edad").value, 10),
      principal: true, retira: "", alergias: ""
    }];
    [].slice.call(people.children).forEach(function (p) {
      lista.push({
        nombre: p.querySelector(".p-nombre").value.trim(),
        edad: parseInt(p.querySelector(".p-edad").value, 10),
        principal: false,
        retira: p.querySelector(".p-retira").value.trim(),
        alergias: p.querySelector(".p-alergias").value.trim()
      });
    });
    return lista.map(function (p) { return Object.assign({}, p, { pista: pistaDe(p.edad) }); });
  }

  function resumen() {
    var l = personas();
    var box = document.getElementById("summary");
    box.innerHTML = l.map(function (p) {
      return '<div class="f-summary-line"><span><span class="nm">' + escapeHtml(p.nombre) + '</span>' +
        ' <span class="ag">· ' + p.edad + ' años' + (p.principal ? " · tú" : "") + '</span></span>' +
        '<span class="pista">' + p.pista + '</span></div>';
    }).join("");
    var hayMenor = l.some(function (p) { return p.edad < 18; });
    var kc = document.getElementById("kidsConsent");
    if (kc) kc.style.display = hayMenor ? "block" : "none";
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ── envío ── */
  async function enviarInscripcion(payload) {
    var r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return true;
  }

  var sendBtn = document.getElementById("send");
  if (sendBtn) {
    sendBtn.addEventListener("click", async function () {
      var l = personas();
      var hayMenor = l.some(function (p) { return p.edad < 18; });
      var ok = true;

      if (hayMenor) {
        var a = document.getElementById("autoriza");
        var eAutoriza = document.getElementById("e-autoriza");
        if (eAutoriza) eAutoriza.classList.toggle("on", !a.checked);
        if (!a.checked) ok = false;
        if (!grupoOk("fotos", "e-fotos")) ok = false;
      }
      if (!ok) {
        var badField = document.getElementById("kidsConsent").querySelector('[aria-invalid="true"], .f-err.on');
        if (badField) badField.scrollIntoView({ block: "center" });
        return;
      }

      var payload = {
        responsable: {
          nombre: document.getElementById("nombre").value.trim(),
          whatsapp: document.getElementById("whatsapp").value.trim(),
          correo: document.getElementById("correo").value.trim(),
          sector: document.getElementById("sector").value,
          primeraVez: document.querySelector('input[name=primera]:checked').value
        },
        personas: l,
        nota: document.getElementById("nota").value.trim(),
        autorizaTutor: hayMenor ? document.getElementById("autoriza").checked : null,
        autorizaFotos: hayMenor ? ((document.querySelector('input[name=fotos]:checked') || {}).value || null) : null,
        enviadoEn: new Date().toISOString(),
        origen: "web"
      };

      var btn = sendBtn, fail = document.getElementById("fail");
      btn.disabled = true;
      btn.textContent = "Enviando…";
      fail.classList.remove("on");

      try {
        await enviarInscripcion(payload);
        sheet.style.display = "none";
        document.getElementById("doneNames").textContent = l.map(function (p) { return p.nombre.split(" ")[0]; }).join(" · ");
        var d = document.getElementById("done");
        d.classList.add("on");
        d.scrollIntoView({ block: "start" });
      } catch (err) {
        fail.innerHTML = 'No pudimos enviar la inscripción. Revisa tu conexión e inténtalo otra vez, o ' +
          '<a href="' + WHATSAPP_FALLBACK + '" target="_blank" rel="noopener">escríbenos por WhatsApp</a> y te inscribimos nosotros.';
        fail.classList.add("on");
        fail.scrollIntoView({ block: "center" });
        btn.disabled = false;
        btn.textContent = "Enviar inscripción";
      }
    });
  }
})();
