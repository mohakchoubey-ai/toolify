    const { jsPDF } = window.jspdf;

    const STORAGE_KEY = "toolify-pro-pdf-project-v6";
    const MAX_IMPORT_DIM = 3200;
    const IMPORT_QUALITY = 0.94;

    const PAGE_SIZES = {
      a4: [210, 297],
      letter: [216, 279],
      legal: [216, 356]
    };

    const state = {
      images: [],
      watermarkImage: null,
      digitalSignatureImage: null,
      digitalSignatureName: "",
      signature: { strokes: [] },
      theme: "dark",
      settings: {
        pageSize: "a4",
        orientation: "portrait",
        margin: 8,
        fitMode: "contain",
        splitLongImages: true,
        outputQuality: 0.95,
        previewScale: 260,
        wmEnabled: false,
        wmType: "text",
        wmText: "Toolify Pro",
        wmPosition: "center",
        wmSize: 24,
        wmOpacity: 18,
        wmRotation: -12,
        signatureSize: 110,
        signaturePosition: "bottom-right",
        strokeWidth: 3,
        editorQuality: 0.96
      }
    };

    const editorState = {
      id: null,
      cropper: null,
      flipX: 1,
      flipY: 1
    };

    const cache = {
      images: new Map(),
      watermark: null
    };

    const els = {
      homeBtn: document.getElementById("homeBtn"),
      themeBtn: document.getElementById("themeBtn"),
      addImagesBtn: document.getElementById("addImagesBtn"),
      saveNowBtn: document.getElementById("saveNowBtn"),
      clearSaveBtn: document.getElementById("clearSaveBtn"),
      saveProjectBtn: document.getElementById("saveProjectBtn"),
      wipeStorageBtn: document.getElementById("wipeStorageBtn"),
      downloadBtn: document.getElementById("downloadBtn"),
      status: document.getElementById("status"),
      saveBadge: document.getElementById("saveBadge"),
      previewInfo: document.getElementById("previewInfo"),

      dropzone: document.getElementById("dropzone"),
      fileInput: document.getElementById("fileInput"),
      thumbs: document.getElementById("thumbs"),
      pdfPreview: document.getElementById("pdfPreview"),

      pageSize: document.getElementById("pageSize"),
      orientation: document.getElementById("orientation"),
      margin: document.getElementById("margin"),
      fitMode: document.getElementById("fitMode"),
      splitLongImages: document.getElementById("splitLongImages"),
      outputQuality: document.getElementById("outputQuality"),
      qualityLabel: document.getElementById("qualityLabel"),
      previewScale: document.getElementById("previewScale"),
      previewScaleLabel: document.getElementById("previewScaleLabel"),

      wmEnabled: document.getElementById("wmEnabled"),
      wmType: document.getElementById("wmType"),
      wmPosition: document.getElementById("wmPosition"),
      wmText: document.getElementById("wmText"),
      wmTextBox: document.getElementById("wmTextBox"),
      wmImageBox: document.getElementById("wmImageBox"),
      wmImageBtn: document.getElementById("wmImageBtn"),
      wmImageInput: document.getElementById("wmImageInput"),
      wmImageClearBtn: document.getElementById("wmImageClearBtn"),
      wmImageName: document.getElementById("wmImageName"),
      wmSize: document.getElementById("wmSize"),
      wmSizeLabel: document.getElementById("wmSizeLabel"),
      wmOpacity: document.getElementById("wmOpacity"),
      wmOpacityLabel: document.getElementById("wmOpacityLabel"),
      wmRotation: document.getElementById("wmRotation"),
      wmRotationLabel: document.getElementById("wmRotationLabel"),

      signPad: document.getElementById("sign-pad"),
      strokeWidth: document.getElementById("strokeWidth"),
      strokeWidthLabel: document.getElementById("strokeWidthLabel"),
      signatureSize: document.getElementById("signatureSize"),
      signatureSizeLabel: document.getElementById("signatureSizeLabel"),
      signaturePosition: document.getElementById("signaturePosition"),
      undoSignBtn: document.getElementById("undoSignBtn"),
      clearSignBtn: document.getElementById("clearSignBtn"),

      editorQuality: document.getElementById("editorQuality"),
      editorQualityLabel: document.getElementById("editorQualityLabel"),

      cropModal: document.getElementById("cropModal"),
      cropImage: document.getElementById("cropImage"),
      cropRotateLeftBtn: document.getElementById("cropRotateLeftBtn"),
      cropRotateRightBtn: document.getElementById("cropRotateRightBtn"),
      cropFlipXBtn: document.getElementById("cropFlipXBtn"),
      cropFlipYBtn: document.getElementById("cropFlipYBtn"),
      cropZoomInBtn: document.getElementById("cropZoomInBtn"),
      cropZoomOutBtn: document.getElementById("cropZoomOutBtn"),
      cropResetBtn: document.getElementById("cropResetBtn"),
      cropSaveBtn: document.getElementById("cropSaveBtn"),
      cropCancelBtn: document.getElementById("cropCancelBtn"),

      editBrightness: document.getElementById("editBrightness"),
      editContrast: document.getElementById("editContrast"),
      editSaturation: document.getElementById("editSaturation"),
      editGrayscale: document.getElementById("editGrayscale"),
      editHue: document.getElementById("editHue"),
      editBlur: document.getElementById("editBlur"),
      editBrightnessLabel: document.getElementById("editBrightnessLabel"),
      editContrastLabel: document.getElementById("editContrastLabel"),
      editSaturationLabel: document.getElementById("editSaturationLabel"),
      editGrayscaleLabel: document.getElementById("editGrayscaleLabel"),
      editHueLabel: document.getElementById("editHueLabel"),
      editBlurLabel: document.getElementById("editBlurLabel"),

      sigDropzone: document.getElementById("sigDropzone"),
      sigFileInput: document.getElementById("sigFileInput"),
      sigFileBtn: document.getElementById("sigFileBtn"),
      sigClearBtn: document.getElementById("sigClearBtn"),
      sigFileName: document.getElementById("sigFileName"),
      sigPreviewWrap: document.getElementById("sigPreviewWrap"),
      sigPreview: document.getElementById("sigPreview")
    };

    let savingTimer = null;
    let previewTimer = null;
    let previewToken = 0;
    let drawing = false;
    let activeStroke = null;
    let activePointerId = null;
    let sortableInstance = null;
    let resizeTimer = null;

    function uid(){
      return "img_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
    }

    function clamp(v, min, max){
      return Math.max(min, Math.min(max, v));
    }

    function setStatus(text, tone = "neutral"){
      const colors = {
        neutral: "var(--muted)",
        ok: "var(--ok)",
        danger: "var(--danger)"
      };
      els.status.textContent = text;
      els.status.style.color = colors[tone] || colors.neutral;
    }

    function pageSizeToMm(pageSize, orientation){
      const base = PAGE_SIZES[pageSize] || PAGE_SIZES.a4;
      return orientation === "landscape" ? [base[1], base[0]] : [base[0], base[1]];
    }

    function applyTheme(theme){
      state.theme = theme === "light" ? "light" : "dark";
      document.body.dataset.theme = state.theme;
      els.themeBtn.textContent = state.theme === "dark" ? "🌙 Dark" : "☀️ Light";
    }

    function defaultTheme(){
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function updateLabels(){
      els.qualityLabel.textContent = Number(els.outputQuality.value).toFixed(2);
      els.previewScaleLabel.textContent = els.previewScale.value;
      els.wmSizeLabel.textContent = els.wmSize.value;
      els.wmOpacityLabel.textContent = `${els.wmOpacity.value}%`;
      els.wmRotationLabel.textContent = `${els.wmRotation.value}°`;
      els.strokeWidthLabel.textContent = els.strokeWidth.value;
      els.signatureSizeLabel.textContent = els.signatureSize.value;
      els.editorQualityLabel.textContent = Number(els.editorQuality.value).toFixed(2);
    }

    function updateEditorLabels(){
      els.editBrightnessLabel.textContent = els.editBrightness.value;
      els.editContrastLabel.textContent = els.editContrast.value;
      els.editSaturationLabel.textContent = els.editSaturation.value;
      els.editGrayscaleLabel.textContent = els.editGrayscale.value;
      els.editHueLabel.textContent = els.editHue.value;
      els.editBlurLabel.textContent = els.editBlur.value;
    }

    function updateWatermarkUI(){
      const type = els.wmType.value;
      els.wmTextBox.style.display = type === "text" ? "block" : "none";
      els.wmImageBox.style.display = type === "image" ? "block" : "none";
    }

    function scheduleSave(){
      clearTimeout(savingTimer);
      savingTimer = setTimeout(saveProjectNow, 450);
    }

    function schedulePreview(){
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        renderPreview();
      }, 180);
    }

    function getProjectSnapshot(){
      return {
        theme: state.theme,
        settings: state.settings,
        images: state.images,
        watermarkImage: state.watermarkImage,
        digitalSignatureImage: state.digitalSignatureImage,
        digitalSignatureName: state.digitalSignatureName,
        signature: state.signature
      };
    }

    function saveProjectNow(){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getProjectSnapshot()));
        els.saveBadge.textContent = `Saved ${new Date().toLocaleTimeString()}`;
        setStatus("Project saved locally.", "ok");
      }catch(err){
        console.error(err);
        els.saveBadge.textContent = "Save failed";
        setStatus("Local storage is full. Reduce image count or size.", "danger");
      }
    }

    function clearStoredProject(){
      localStorage.removeItem(STORAGE_KEY);
      els.saveBadge.textContent = "Stored project cleared";
      setStatus("Stored project removed.", "ok");
    }

    async function loadProject(){
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw){
        applyTheme(defaultTheme());
        updateUIFromState();
        setStatus("Ready. Add images to begin.", "neutral");
        return;
      }

      try{
        const parsed = JSON.parse(raw);
        state.theme = parsed.theme || defaultTheme();
        state.settings = { ...state.settings, ...(parsed.settings || {}) };
        state.images = Array.isArray(parsed.images) ? parsed.images : [];
        state.watermarkImage = parsed.watermarkImage || null;
        state.digitalSignatureImage = parsed.digitalSignatureImage || null;
        state.digitalSignatureName = parsed.digitalSignatureName || "";
        state.signature = parsed.signature || { strokes: [] };

        applyTheme(state.theme);
        updateUIFromState();
        renderImages();
        renderSignature();
        schedulePreview();
        setStatus("Saved project restored.", "ok");
        els.saveBadge.textContent = "Project restored";
      }catch(err){
        console.error(err);
        applyTheme(defaultTheme());
        setStatus("Saved project was corrupted. Starting fresh.", "danger");
      }
    }

    function loadImage(src){
      if (cache.images.has(src)) return cache.images.get(src);
      const p = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
      cache.images.set(src, p);
      return p;
    }

    async function fileToDataURL(file, maxSize = 2400, quality = 0.92){
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = await loadImage(src);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const outType = file.type === "image/png" ? "image/png" : "image/jpeg";
      return canvas.toDataURL(outType, quality);
    }

    async function fileToProcessedItem(file){
      const src = await fileToDataURL(file, MAX_IMPORT_DIM, IMPORT_QUALITY);
      const img = await loadImage(src);

      return {
        id: uid(),
        name: file.name.replace(/\.[^.]+$/, ""),
        src,
        w: img.width,
        h: img.height
      };
    }

    async function handleFiles(fileList){
      const files = [...fileList].filter(f => f.type && f.type.startsWith("image/"));
      if (!files.length){
        setStatus("No valid image files found.", "danger");
        return;
      }

      setStatus(`Importing ${files.length} image(s)...`);
      for (const file of files){
        try{
          const item = await fileToProcessedItem(file);
          state.images.push(item);
        }catch(err){
          console.error(err);
        }
      }

      renderImages();
      schedulePreview();
      scheduleSave();
      setStatus(`${files.length} image(s) added.`, "ok");
    }

    function renderImages(){
      els.thumbs.innerHTML = "";

      if (!state.images.length){
        els.thumbs.innerHTML = `
          <div class="card" style="grid-column:1/-1;">
            <div class="meta">
              <div class="name">No images added yet.</div>
              <div class="hint">Use upload or drag-and-drop to start.</div>
            </div>
          </div>
        `;
        return;
      }

      for (const item of state.images){
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.id = item.id;

        card.innerHTML = `
          <div class="img-wrap">
            <img src="${item.src}" alt="${item.name}" />
          </div>
          <div class="meta">
            <div class="name" title="${item.name}">${item.name}</div>
            <div class="actions">
              <button class="btn-secondary" data-action="edit">Edit</button>
              <button class="btn-danger" data-action="delete">Delete</button>
            </div>
          </div>
        `;

        card.querySelector('[data-action="edit"]').addEventListener("click", () => openEditor(item.id));
        card.querySelector('[data-action="delete"]').addEventListener("click", () => deleteImage(item.id));
        els.thumbs.appendChild(card);
      }

      if (!sortableInstance){
        sortableInstance = new Sortable(els.thumbs, {
          animation: 180,
          ghostClass: "ghost",
          onEnd: () => {
            const orderedIds = [...els.thumbs.querySelectorAll(".card")].map(el => el.dataset.id);
            const map = new Map(state.images.map(img => [img.id, img]));
            state.images = orderedIds.map(id => map.get(id)).filter(Boolean);
            schedulePreview();
            scheduleSave();
            setStatus("Images reordered.", "ok");
          }
        });
      }
    }

    function deleteImage(id){
      state.images = state.images.filter(img => img.id !== id);
      renderImages();
      schedulePreview();
      scheduleSave();
      setStatus("Image deleted.", "ok");
    }

    function updateSettingsFromUI(){
      state.settings.pageSize = els.pageSize.value;
      state.settings.orientation = els.orientation.value;
      state.settings.margin = clamp(Number(els.margin.value || 0), 0, 30);
      state.settings.fitMode = els.fitMode.value;
      state.settings.splitLongImages = els.splitLongImages.checked;
      state.settings.outputQuality = Number(els.outputQuality.value);
      state.settings.previewScale = Number(els.previewScale.value);

      state.settings.wmEnabled = els.wmEnabled.checked;
      state.settings.wmType = els.wmType.value;
      state.settings.wmPosition = els.wmPosition.value;
      state.settings.wmText = els.wmText.value;
      state.settings.wmSize = Number(els.wmSize.value);
      state.settings.wmOpacity = Number(els.wmOpacity.value);
      state.settings.wmRotation = Number(els.wmRotation.value);

      state.settings.signatureSize = Number(els.signatureSize.value);
      state.settings.signaturePosition = els.signaturePosition.value;
      state.settings.strokeWidth = Number(els.strokeWidth.value);
      state.settings.editorQuality = Number(els.editorQuality.value);

      updateLabels();
      updateWatermarkUI();
      updateEditorLabels();
    }

    function updateUIFromState(){
      const s = state.settings;

      els.pageSize.value = s.pageSize;
      els.orientation.value = s.orientation;
      els.margin.value = s.margin;
      els.fitMode.value = s.fitMode;
      els.splitLongImages.checked = s.splitLongImages;
      els.outputQuality.value = s.outputQuality;
      els.previewScale.value = s.previewScale;

      els.wmEnabled.checked = s.wmEnabled;
      els.wmType.value = s.wmType;
      els.wmPosition.value = s.wmPosition;
      els.wmText.value = s.wmText;
      els.wmSize.value = s.wmSize;
      els.wmOpacity.value = s.wmOpacity;
      els.wmRotation.value = s.wmRotation;

      els.signatureSize.value = s.signatureSize;
      els.signaturePosition.value = s.signaturePosition;
      els.strokeWidth.value = s.strokeWidth;
      els.editorQuality.value = s.editorQuality;

      updateLabels();
      updateWatermarkUI();
      updateEditorLabels();

      if (state.watermarkImage) {
        els.wmImageName.textContent = "Watermark image loaded";
      } else {
        els.wmImageName.textContent = "No watermark image selected";
      }

      if (state.digitalSignatureImage) {
        els.sigFileName.textContent = state.digitalSignatureName || "Digital signature loaded";
        els.sigPreview.src = state.digitalSignatureImage;
        els.sigPreviewWrap.style.display = "block";
      } else {
        els.sigFileName.textContent = "No digital signature selected";
        els.sigPreviewWrap.style.display = "none";
      }
    }

    function getCanvasPoint(evt){
      const rect = els.signPad.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    }

    function resizeSignatureCanvas(){
      const canvas = els.signPad;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      const snapshot = state.signature.strokes.map(stroke => stroke.map(p => ({...p})));

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Number(state.settings.strokeWidth);

      if (snapshot.length){
        state.signature.strokes = snapshot;
        redrawSignature();
      }
    }

    function redrawSignature(){
      const canvas = els.signPad;
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111827";
      ctx.lineWidth = Number(state.settings.strokeWidth);

      for (const stroke of state.signature.strokes){
        if (!stroke.length) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++){
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    }

    function renderSignature(){
      redrawSignature();
    }

    function clearSignature(){
      state.signature.strokes = [];
      redrawSignature();
      schedulePreview();
      scheduleSave();
      setStatus("Signature cleared.", "ok");
    }

    function undoSignature(){
      if (!state.signature.strokes.length) return;
      state.signature.strokes.pop();
      redrawSignature();
      schedulePreview();
      scheduleSave();
      setStatus("Last signature stroke removed.", "ok");
    }

    function startStroke(evt){
      evt.preventDefault();
      els.signPad.setPointerCapture(evt.pointerId);
      drawing = true;
      activePointerId = evt.pointerId;

      const p = getCanvasPoint(evt);
      activeStroke = [p];
      state.signature.strokes.push(activeStroke);

      const ctx = els.signPad.getContext("2d");
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }

    function moveStroke(evt){
      if (!drawing || evt.pointerId !== activePointerId) return;
      evt.preventDefault();

      const p = getCanvasPoint(evt);
      activeStroke.push(p);

      const ctx = els.signPad.getContext("2d");
      ctx.lineWidth = Number(state.settings.strokeWidth);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }

    function endStroke(evt){
      if (evt.pointerId !== activePointerId) return;
      drawing = false;
      activePointerId = null;
      activeStroke = null;
      els.signPad.getContext("2d").beginPath();
      schedulePreview();
      scheduleSave();
    }

    function updateCropPreviewFilter(){
      els.cropImage.style.filter = currentEditorFilterString();
    }

    function openEditor(id){
      const item = state.images.find(img => img.id === id);
      if (!item) return;

      editorState.id = id;
      editorState.flipX = 1;
      editorState.flipY = 1;

      els.editBrightness.value = 100;
      els.editContrast.value = 100;
      els.editSaturation.value = 100;
      els.editGrayscale.value = 0;
      els.editHue.value = 0;
      els.editBlur.value = 0;
      updateEditorLabels();
      updateCropPreviewFilter();

      els.cropModal.style.display = "block";
      document.body.style.overflow = "hidden";

      if (editorState.cropper){
        editorState.cropper.destroy();
        editorState.cropper = null;
      }

      els.cropImage.onload = () => {
        editorState.cropper = new Cropper(els.cropImage, {
          viewMode: 1,
          dragMode: "move",
          autoCropArea: 1,
          responsive: true,
          background: false,
          movable: true,
          zoomable: true,
          rotatable: true,
          scalable: true,
          center: true,
          highlight: false
        });
      };

      els.cropImage.src = item.src;
    }

    function closeEditor(){
      if (editorState.cropper){
        editorState.cropper.destroy();
        editorState.cropper = null;
      }
      editorState.id = null;
      els.cropModal.style.display = "none";
      document.body.style.overflow = "";
    }

    function applyEditorLabels(){
      els.editBrightnessLabel.textContent = els.editBrightness.value;
      els.editContrastLabel.textContent = els.editContrast.value;
      els.editSaturationLabel.textContent = els.editSaturation.value;
      els.editGrayscaleLabel.textContent = els.editGrayscale.value;
      els.editHueLabel.textContent = els.editHue.value;
      els.editBlurLabel.textContent = els.editBlur.value;
    }

    function currentEditorFilterString(){
      return [
        `brightness(${els.editBrightness.value}%)`,
        `contrast(${els.editContrast.value}%)`,
        `saturate(${els.editSaturation.value}%)`,
        `grayscale(${els.editGrayscale.value}%)`,
        `hue-rotate(${els.editHue.value}deg)`,
        `blur(${els.editBlur.value}px)`
      ].join(" ");
    }

    async function saveEditorImage(){
      if (!editorState.cropper || !editorState.id) return;

      const itemIndex = state.images.findIndex(img => img.id === editorState.id);
      if (itemIndex === -1) return;

      const quality = Number(state.settings.editorQuality);

      const cropped = editorState.cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
        fillColor: "#ffffff"
      });

      const filtered = document.createElement("canvas");
      filtered.width = cropped.width;
      filtered.height = cropped.height;

      const fctx = filtered.getContext("2d");
      fctx.save();
      fctx.filter = currentEditorFilterString();
      fctx.translate(filtered.width / 2, filtered.height / 2);
      fctx.scale(editorState.flipX, editorState.flipY);
      fctx.drawImage(cropped, -cropped.width / 2, -cropped.height / 2);
      fctx.restore();

      const outSrc = filtered.toDataURL("image/jpeg", quality);

      state.images[itemIndex].src = outSrc;
      state.images[itemIndex].w = filtered.width;
      state.images[itemIndex].h = filtered.height;

      cache.images.set(outSrc, Promise.resolve(await loadImage(outSrc)).catch(()=>null));

      renderImages();
      schedulePreview();
      scheduleSave();
      closeEditor();
      setStatus("Image updated.", "ok");
    }

    function getCoverCrop(imgW, imgH, targetW, targetH){
      const imgRatio = imgW / imgH;
      const targetRatio = targetW / targetH;

      let sx = 0, sy = 0, sw = imgW, sh = imgH;

      if (imgRatio > targetRatio){
        sw = imgH * targetRatio;
        sx = (imgW - sw) / 2;
      }else{
        sh = imgW / targetRatio;
        sy = (imgH - sh) / 2;
      }

      return { sx, sy, sw, sh };
    }

    function getPositionBox(pos, pageW, pageH, boxW, boxH, margin){
      const left = margin;
      const top = margin;
      const right = pageW - margin - boxW;
      const bottom = pageH - margin - boxH;
      const centerX = (pageW - boxW) / 2;
      const centerY = (pageH - boxH) / 2;

      switch(pos){
        case "top-left": return {x:left, y:top};
        case "top-right": return {x:right, y:top};
        case "bottom-left": return {x:left, y:bottom};
        case "bottom-right": return {x:right, y:bottom};
        case "center":
        default: return {x:centerX, y:centerY};
      }
    }

    function signatureHasInk(){
      return state.signature.strokes.some(s => s.length > 0);
    }

    function getSignatureExportSource(){
      if (state.digitalSignatureImage) return state.digitalSignatureImage;
      if (signatureHasInk()) return els.signPad.toDataURL("image/png");
      return null;
    }

    async function drawWatermarkOnCanvas(ctx, pageW, pageH, scale){
      if (!state.settings.wmEnabled) return;

      const type = state.settings.wmType;
      const opacity = Number(state.settings.wmOpacity) / 100;
      const rotation = Number(state.settings.wmRotation) * Math.PI / 180;
      const sizeMm = Number(state.settings.wmSize);
      const margin = 8;

      ctx.save();
      ctx.globalAlpha = opacity;

      if (type === "text"){
        const text = (state.settings.wmText || "").trim();
        if (!text){
          ctx.restore();
          return;
        }

        const px = Math.max(12, sizeMm * scale * 1.4);
        ctx.font = `700 ${px}px Inter, system-ui, sans-serif`;
        ctx.fillStyle = state.theme === "dark" ? "rgba(255,255,255,.92)" : "rgba(17,24,39,.85)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textWidth = ctx.measureText(text).width / scale;
        const boxW = textWidth;
        const boxH = px / scale;
        const pos = getPositionBox(state.settings.wmPosition, pageW, pageH, boxW, boxH, margin);
        const cx = (pos.x + boxW / 2) * scale;
        const cy = (pos.y + boxH / 2) * scale;

        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.fillText(text, 0, 0);
      }else if (state.watermarkImage){
        const img = await (cache.watermark || (cache.watermark = loadImage(state.watermarkImage)));
        const aspect = img.width / img.height;
        const boxW = sizeMm;
        const boxH = sizeMm / aspect;
        const pos = getPositionBox(state.settings.wmPosition, pageW, pageH, boxW, boxH, margin);

        const cx = (pos.x + boxW / 2) * scale;
        const cy = (pos.y + boxH / 2) * scale;

        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.drawImage(img, -boxW * scale / 2, -boxH * scale / 2, boxW * scale, boxH * scale);
      }

      ctx.restore();
    }

    async function drawSignatureOnCanvas(ctx, pageW, pageH, scale){
      const source = getSignatureExportSource();
      if (!source) return;

      const sigImg = await loadImage(source);
      const aspect = sigImg.width / sigImg.height;
      const sizeMm = Number(state.settings.signatureSize);
      const boxW = sizeMm;
      const boxH = sizeMm / aspect;

      let x = pageW - boxW - 8;
      let y = pageH - boxH - 10;

      if (state.settings.signaturePosition === "bottom-left"){
        x = 8;
      }else if (state.settings.signaturePosition === "center"){
        x = (pageW - boxW) / 2;
        y = (pageH - boxH) / 2;
      }

      ctx.drawImage(sigImg, x * scale, y * scale, boxW * scale, boxH * scale);
    }

    async function buildPagePlan(){
      const [pageW, pageH] = pageSizeToMm(state.settings.pageSize, state.settings.orientation);
      const margin = Number(state.settings.margin || 0);
      const printableW = Math.max(1, pageW - margin * 2);
      const printableH = Math.max(1, pageH - margin * 2);

      const pages = [];

      for (const item of state.images){
        const imgW = item.w || 1;
        const imgH = item.h || 1;

        if (state.settings.fitMode === "fill"){
          pages.push({
            type: "fill",
            src: item.src,
            x: margin,
            y: margin,
            w: printableW,
            h: printableH
          });
          continue;
        }

        if (state.settings.fitMode === "cover"){
          pages.push({
            type: "cover",
            src: item.src,
            x: margin,
            y: margin,
            w: printableW,
            h: printableH
          });
          continue;
        }

        const ratio = printableW / imgW;
        const drawH = imgH * ratio;

        if (state.settings.splitLongImages && drawH > printableH + 0.5){
          const sliceSrcH = printableH / ratio;
          let sy = 0;

          while (sy < imgH - 0.1){
            const sh = Math.min(sliceSrcH, imgH - sy);
            const dh = sh * ratio;

            pages.push({
              type: "slice",
              src: item.src,
              sx: 0,
              sy,
              sw: imgW,
              sh,
              x: margin,
              y: margin,
              w: printableW,
              h: dh
            });

            sy += sh;
          }
        }else{
          const drawW = printableW;
          const drawH2 = imgH * ratio;
          pages.push({
            type: "contain",
            src: item.src,
            x: margin,
            y: margin + (printableH - drawH2) / 2,
            w: drawW,
            h: drawH2
          });
        }
      }

      return { pageW, pageH, pages };
    }

    async function renderPageToCanvas(page, pageW, pageH, scale, isLast = false){
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(pageW * scale));
      canvas.height = Math.max(1, Math.round(pageH * scale));

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const img = await loadImage(page.src);

      if (page.type === "slice"){
        ctx.drawImage(
          img,
          page.sx, page.sy, page.sw, page.sh,
          page.x * scale, page.y * scale, page.w * scale, page.h * scale
        );
      }else if (page.type === "cover"){
        const crop = getCoverCrop(img.width, img.height, page.w, page.h);
        ctx.drawImage(
          img,
          crop.sx, crop.sy, crop.sw, crop.sh,
          page.x * scale, page.y * scale, page.w * scale, page.h * scale
        );
      }else{
        ctx.drawImage(
          img,
          0, 0, img.width, img.height,
          page.x * scale, page.y * scale, page.w * scale, page.h * scale
        );
      }

      await drawWatermarkOnCanvas(ctx, pageW, pageH, scale);
      if (isLast) {
        await drawSignatureOnCanvas(ctx, pageW, pageH, scale);
      }

      return canvas;
    }

    async function renderPreview(){
      const token = ++previewToken;
      const plan = await buildPagePlan();
      if (token !== previewToken) return;

      els.pdfPreview.innerHTML = "";

      if (!plan.pages.length){
        els.pdfPreview.innerHTML = `
          <div class="page-card" style="grid-column:1/-1;">
            <div class="page-empty">No PDF pages yet. Add images to generate preview.</div>
          </div>
        `;
        els.previewInfo.textContent = "No pages yet";
        return;
      }

      els.previewInfo.textContent = `${plan.pages.length} page(s)`;

      const scale = Number(state.settings.previewScale) / plan.pageW;

      for (let i = 0; i < plan.pages.length; i++){
        const page = plan.pages[i];
        const canvas = await renderPageToCanvas(page, plan.pageW, plan.pageH, scale, i === plan.pages.length - 1);

        const card = document.createElement("div");
        card.className = "page-card";
        card.innerHTML = `<div class="page-title">Page ${i + 1}</div>`;
        card.appendChild(canvas);
        els.pdfPreview.appendChild(card);
      }
    }

    async function exportPDF(){
      if (!state.images.length){
        setStatus("Add at least one image before exporting.", "danger");
        return;
      }

      els.downloadBtn.disabled = true;
      els.downloadBtn.textContent = "Generating...";
      setStatus("Building PDF...", "neutral");

      try{
        const plan = await buildPagePlan();
        const doc = new jsPDF({
          orientation: state.settings.orientation,
          unit: "mm",
          format: state.settings.pageSize
        });

        for (let i = 0; i < plan.pages.length; i++){
          if (i > 0) doc.addPage(state.settings.pageSize, state.settings.orientation);

          const pageCanvas = await renderPageToCanvas(
            plan.pages[i],
            plan.pageW,
            plan.pageH,
            4,
            i === plan.pages.length - 1
          );

          const dataURL = pageCanvas.toDataURL("image/jpeg", state.settings.outputQuality);
          doc.addImage(dataURL, "JPEG", 0, 0, plan.pageW, plan.pageH, undefined, "FAST");
        }

        doc.save("toolify-pro.pdf");
        setStatus("PDF exported successfully.", "ok");
      }catch(err){
        console.error(err);
        setStatus("PDF export failed. Check the console.", "danger");
      }finally{
        els.downloadBtn.disabled = false;
        els.downloadBtn.textContent = "Download PDF";
      }
    }

    async function loadWatermarkImage(file){
      if (!file || !file.type.startsWith("image/")) return;

      const src = await fileToDataURL(file, 2200, 0.96);
      state.watermarkImage = src;
      cache.watermark = null;
      els.wmImageName.textContent = file.name;
      setStatus("Watermark image loaded.", "ok");
      schedulePreview();
      scheduleSave();
    }

    async function loadSignatureFile(file){
      if (!file || !file.type.startsWith("image/")) {
        setStatus("Signature file must be an image.", "danger");
        return;
      }

      const src = await fileToDataURL(file, 2200, 0.98);
      state.digitalSignatureImage = src;
      state.digitalSignatureName = file.name;

      els.sigFileName.textContent = file.name;
      els.sigPreview.src = src;
      els.sigPreviewWrap.style.display = "block";

      setStatus("Digital signature loaded.", "ok");
      schedulePreview();
      scheduleSave();
    }

    function clearSignatureFile(){
      state.digitalSignatureImage = null;
      state.digitalSignatureName = "";
      els.sigFileInput.value = "";
      els.sigFileName.textContent = "No digital signature selected";
      els.sigPreview.removeAttribute("src");
      els.sigPreviewWrap.style.display = "none";

      setStatus("Digital signature file removed.", "ok");
      schedulePreview();
      scheduleSave();
    }

    function initEvents(){
      els.homeBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });

      els.themeBtn.addEventListener("click", () => {
        applyTheme(state.theme === "dark" ? "light" : "dark");
        scheduleSave();
      });

      els.addImagesBtn.addEventListener("click", () => els.fileInput.click());
      els.dropzone.addEventListener("click", () => els.fileInput.click());

      els.fileInput.addEventListener("change", async (e) => {
        const files = e.target.files;
        if (files && files.length) await handleFiles(files);
        els.fileInput.value = "";
      });

      els.dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        els.dropzone.style.borderColor = "var(--accent2)";
      });

      els.dropzone.addEventListener("dragleave", () => {
        els.dropzone.style.borderColor = "color-mix(in srgb, var(--muted) 45%, transparent)";
      });

      els.dropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        els.dropzone.style.borderColor = "color-mix(in srgb, var(--muted) 45%, transparent)";
        await handleFiles(e.dataTransfer.files);
      });

      els.saveNowBtn.addEventListener("click", saveProjectNow);
      els.clearSaveBtn.addEventListener("click", clearStoredProject);
      els.saveProjectBtn.addEventListener("click", saveProjectNow);
      els.wipeStorageBtn.addEventListener("click", clearStoredProject);
      els.downloadBtn.addEventListener("click", exportPDF);

      const refreshers = [
        els.pageSize, els.orientation, els.margin, els.fitMode, els.splitLongImages,
        els.outputQuality, els.previewScale,
        els.wmEnabled, els.wmType, els.wmPosition, els.wmText, els.wmSize, els.wmOpacity, els.wmRotation,
        els.signatureSize, els.signaturePosition, els.strokeWidth, els.editorQuality
      ];

      refreshers.forEach(el => {
        el.addEventListener("input", () => {
          updateSettingsFromUI();
          schedulePreview();
          scheduleSave();
        });
        el.addEventListener("change", () => {
          updateSettingsFromUI();
          schedulePreview();
          scheduleSave();
        });
      });

      els.wmImageBtn.addEventListener("click", () => els.wmImageInput.click());
      els.wmImageInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")){
          setStatus("Watermark must be an image.", "danger");
          return;
        }
        await loadWatermarkImage(file);
      });

      els.wmImageClearBtn.addEventListener("click", () => {
        state.watermarkImage = null;
        cache.watermark = null;
        els.wmImageName.textContent = "No watermark image selected";
        schedulePreview();
        scheduleSave();
        setStatus("Watermark image removed.", "ok");
      });

      els.sigFileBtn.addEventListener("click", () => els.sigFileInput.click());
      els.sigFileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) await loadSignatureFile(file);
      });

      els.sigClearBtn.addEventListener("click", clearSignatureFile);

      els.sigDropzone.addEventListener("click", () => els.sigFileInput.click());
      els.sigDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        els.sigDropzone.style.borderColor = "var(--accent2)";
      });
      els.sigDropzone.addEventListener("dragleave", () => {
        els.sigDropzone.style.borderColor = "color-mix(in srgb, var(--muted) 45%, transparent)";
      });
      els.sigDropzone.addEventListener("drop", async (e) => {
        e.preventDefault();
        els.sigDropzone.style.borderColor = "color-mix(in srgb, var(--muted) 45%, transparent)";
        const file = e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) await loadSignatureFile(file);
      });

      els.strokeWidth.addEventListener("input", () => {
        state.settings.strokeWidth = Number(els.strokeWidth.value);
        updateLabels();
        redrawSignature();
        schedulePreview();
        scheduleSave();
      });

      els.signPad.addEventListener("pointerdown", startStroke);
      els.signPad.addEventListener("pointermove", moveStroke);
      els.signPad.addEventListener("pointerup", endStroke);
      els.signPad.addEventListener("pointercancel", endStroke);
      els.signPad.addEventListener("pointerleave", endStroke);

      els.undoSignBtn.addEventListener("click", undoSignature);
      els.clearSignBtn.addEventListener("click", clearSignature);

      els.cropRotateLeftBtn.addEventListener("click", () => editorState.cropper && editorState.cropper.rotate(-90));
      els.cropRotateRightBtn.addEventListener("click", () => editorState.cropper && editorState.cropper.rotate(90));
      els.cropFlipXBtn.addEventListener("click", () => {
        editorState.flipX *= -1;
        if (editorState.cropper) editorState.cropper.scaleX(editorState.flipX);
      });
      els.cropFlipYBtn.addEventListener("click", () => {
        editorState.flipY *= -1;
        if (editorState.cropper) editorState.cropper.scaleY(editorState.flipY);
      });
      els.cropZoomInBtn.addEventListener("click", () => editorState.cropper && editorState.cropper.zoom(0.1));
      els.cropZoomOutBtn.addEventListener("click", () => editorState.cropper && editorState.cropper.zoom(-0.1));
      els.cropResetBtn.addEventListener("click", () => {
        if (!editorState.cropper) return;
        editorState.cropper.reset();
        editorState.flipX = 1;
        editorState.flipY = 1;
      });
      els.cropSaveBtn.addEventListener("click", saveEditorImage);
      els.cropCancelBtn.addEventListener("click", closeEditor);

      [els.editBrightness, els.editContrast, els.editSaturation, els.editGrayscale, els.editHue, els.editBlur].forEach(el => {
        el.addEventListener("input", () => {
          updateEditorLabels();
          updateCropPreviewFilter();
        });
      });

      els.cropModal.addEventListener("click", (e) => {
        if (e.target === els.cropModal) closeEditor();
      });

      window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resizeSignatureCanvas();
          schedulePreview();
        }, 140);
      });

      window.addEventListener("beforeunload", () => {
        saveProjectNow();
      });
    }

    function bootstrap(){
      applyTheme(defaultTheme());
      updateUIFromState();
      initEvents();
      resizeSignatureCanvas();
      loadProject().then(() => {
        updateSettingsFromUI();
        renderImages();
        schedulePreview();
      });
      setStatus("Ready. Add images to begin.", "neutral");
    }

    bootstrap(); 
