import { useState, useRef, useEffect, useCallback } from "react";
import Head from "next/head";

const PHOTO_RECT = { x: 307, y: 286, w: 891, h: 915 };

export default function Home() {
  const [propertyImg, setPropertyImg] = useState(null);
  const [templateImg, setTemplateImg] = useState(null);
  const [thumbData, setThumbData] = useState(null);
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const workCanvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setTemplateImg(img);
    img.onerror = () => setStatus("Template image failed to load. Check /public/template.png.");
    img.src = "/template.png";
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setStatus("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setPropertyImg(img);
        setThumbData({ src: e.target.result, name: file.name, size: file.size });
        setReady(true);
        setStatus("");
        setDownloadUrl(null);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const generate = useCallback(() => {
    if (!propertyImg || !templateImg) return;
    setStatus("Compositing...");

    const work = workCanvasRef.current;
    const ctx = work.getContext("2d");
    work.width = 1500;
    work.height = 1500;
    ctx.clearRect(0, 0, 1500, 1500);

    const pr = PHOTO_RECT;
    const srcW = propertyImg.width;
    const srcH = propertyImg.height;
    const targetAspect = pr.w / pr.h;
    const srcAspect = srcW / srcH;

    let sx, sy, sw, sh;
    if (srcAspect > targetAspect) {
      sh = srcH; sw = srcH * targetAspect;
      sx = (srcW - sw) / 2; sy = 0;
    } else {
      sw = srcW; sh = srcW / targetAspect;
      sx = 0; sy = (srcH - sh) / 2;
    }

    ctx.drawImage(propertyImg, sx, sy, sw, sh, pr.x, pr.y, pr.w, pr.h);
    ctx.drawImage(templateImg, 0, 0, 1500, 1500);

    const out = outputCanvasRef.current;
    const outCtx = out.getContext("2d");
    out.width = 1500;
    out.height = 1500;
    outCtx.drawImage(work, 0, 0);

    const dataUrl = out.toDataURL("image/jpeg", 0.95);
    setDownloadUrl(dataUrl);
    setStatus("1500 x 1500 JPG ready.");
  }, [propertyImg, templateImg]);

  const download = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "team-tessa-closing.jpg";
    a.click();
  }, [downloadUrl]);

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  return (
    <>
      <Head>
        <title>Team Tessa: Closing Photo Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; font-family: 'DM Sans', sans-serif; }
        .app {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 0 4rem;
          background: #ffffff;
        }
        .site-header {
          width: 100%;
          margin-bottom: 2.5rem;
          line-height: 0;
        }
        .site-header img {
          width: 100%;
          height: auto;
          display: block;
        }
        .content {
          width: 100%;
          max-width: 520px;
          padding: 0 1.5rem;
        }
        .card {
          background: #fff; border-radius: 16px; border: 0.5px solid #e2dbd6;
          padding: 2rem; width: 100%; margin-bottom: 1.5rem;
        }
        .section-label {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #9a8c82; margin-bottom: 0.75rem;
        }
        .drop-zone {
          border: 1.5px dashed #c9bfb8; border-radius: 12px; padding: 2.5rem 1.5rem;
          text-align: center; cursor: pointer; transition: all 0.2s;
          background: #f9f9f9; position: relative;
        }
        .drop-zone:hover, .drop-zone.drag-over {
          border-color: #8b6f5e; background: #f5ede8;
        }
        .drop-icon {
          width: 44px; height: 44px; margin: 0 auto 1rem; background: #f0e8e3;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
        }
        .drop-label { font-size: 14px; font-weight: 500; color: #4a3728; margin-bottom: 0.25rem; }
        .drop-sub { font-size: 12px; color: #9a8c82; }
        .file-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
        .thumb-row {
          display: flex; align-items: center; gap: 10px; margin-top: 0.75rem;
          padding: 10px 12px; background: #f9f9f9; border-radius: 8px;
          border: 0.5px solid #e2dbd6;
        }
        .thumb-img { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 0.5px solid #e2dbd6; flex-shrink: 0; }
        .thumb-name { font-size: 13px; color: #4a3728; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .thumb-size { font-size: 11px; color: #9a8c82; flex-shrink: 0; }
        .badge {
          display: inline-flex; align-items: center; gap: 5px; background: #eaf3de;
          color: #3b6d11; font-size: 11px; font-weight: 500; padding: 3px 10px;
          border-radius: 20px; margin-top: 0.75rem;
        }
        .preview-wrap {
          border-radius: 10px; overflow: hidden; border: 0.5px solid #e2dbd6;
          background: #1a1614; min-height: 180px; display: flex;
          align-items: center; justify-content: center;
        }
        .preview-wrap canvas { display: block; max-width: 100%; height: auto; }
        .placeholder { padding: 3rem 1rem; text-align: center; }
        .btn-row { display: flex; gap: 10px; margin-top: 1.25rem; }
        .btn-primary {
          flex: 1; background: #4a3728; color: #f7f4f0; border: none;
          border-radius: 10px; padding: 13px 20px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s;
        }
        .btn-primary:hover:not(:disabled) { background: #362a1f; }
        .btn-primary:disabled { background: #c9bfb8; cursor: not-allowed; }
        .btn-secondary {
          background: #fff; color: #4a3728; border: 0.5px solid #c9bfb8;
          border-radius: 10px; padding: 13px 20px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; cursor: pointer; transition: all 0.15s;
        }
        .btn-secondary:hover:not(:disabled) { background: #faf8f6; border-color: #8b6f5e; }
        .btn-secondary:disabled { color: #c9bfb8; cursor: not-allowed; }
        .status { font-size: 12px; color: #8b6f5e; text-align: center; margin-top: 0.75rem; min-height: 18px; }
      `}</style>

      <div className="app">
        <div className="site-header">
          <img src="/team_tessa_header.jpg" alt="Team Tessa" />
        </div>

        <div className="content">

        <div className="card">
          <div className="section-label">Property Photo</div>
          <div
            className={`drop-zone${dragOver ? " drag-over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="image/*"
              onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
            />
            <div className="drop-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b6f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="drop-label">Drop property photo here</div>
            <div className="drop-sub">or click to browse. JPG, PNG, HEIC supported.</div>
          </div>

          {thumbData && (
            <>
              <div className="thumb-row">
                <img className="thumb-img" src={thumbData.src} alt="" />
                <span className="thumb-name">{thumbData.name}</span>
                <span className="thumb-size">{formatBytes(thumbData.size)}</span>
              </div>
              <div className="badge">
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#639922"/></svg>
                Ready to generate
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="section-label">Preview</div>
          <div className="preview-wrap">
            {downloadUrl ? (
              <canvas ref={outputCanvasRef} style={{ display: "block", maxWidth: "100%", height: "auto" }} />
            ) : (
              <>
                <canvas ref={outputCanvasRef} style={{ display: "none" }} />
                <div className="placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9bfb8" strokeWidth="1" strokeLinecap="round" style={{ display: "block", margin: "0 auto 10px" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div style={{ fontSize: "13px", color: "#c9bfb8" }}>Preview will appear here</div>
                </div>
              </>
            )}
          </div>

          <div className="btn-row">
            <button className="btn-primary" onClick={generate} disabled={!ready || !templateImg}>
              Generate Image
            </button>
            <button className="btn-secondary" onClick={download} disabled={!downloadUrl}>
              Download JPG
            </button>
          </div>
          <div className="status">{status}</div>
        </div>
        </div>
      </div>

      <canvas ref={workCanvasRef} width="1500" height="1500" style={{ display: "none" }} />
    </>
  );
}
