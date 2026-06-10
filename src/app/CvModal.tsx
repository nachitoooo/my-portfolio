"use client";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type Lang = "en" | "es";

export default function CvModal({ onClose, lang }: { onClose: () => void; lang: Lang }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(700);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setPage(p => Math.min(numPages, p + 1));
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   setPage(p => Math.max(1, p - 1));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, numPages]);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setPageWidth(Math.min(700, e.contentRect.width - 40));
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const btnStyle: React.CSSProperties = {
    background: "rgba(192,132,252,0.08)",
    border: "1px solid #6b21a8",
    borderRadius: "3px",
    color: "#c084fc",
    fontFamily: '"Pixel NES", monospace',
    fontSize: "10px",
    padding: "4px 10px",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
  };
  const btnDisabled: React.CSSProperties = { ...btnStyle, opacity: 0.3, cursor: "default" };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9998,
        background: "rgba(8,2,20,0.93)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(780px, 96vw)", height: "min(92vh, 900px)",
          display: "flex", flexDirection: "column",
          background: "#06010e",
          border: "2px solid #6b21a8",
          boxShadow: "0 0 60px #c084fc44, 0 0 0 1px #3b0764",
          fontFamily: '"Pixel NES", monospace',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Title bar ── */}
        <div style={{
          background: "#150430", borderBottom: "1px solid #6b21a8",
          padding: "6px 12px", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          flexShrink: 0,
        }}>
          <span style={{ color: "#c084fc", fontSize: "10px", letterSpacing: "0.5px" }}>
            📄 ignacio-aristegui-cv.pdf
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a
              href="/cv/ignacio-aristegui-cv.pdf"
              download="ignacio-aristegui-cv.pdf"
              onClick={e => e.stopPropagation()}
              style={{ ...btnStyle, textDecoration: "none" }}
            >
              ↓ {lang === "en" ? "download" : "descargar"}
            </a>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#c084fc", cursor: "pointer", fontFamily: "inherit", fontSize: "11px" }}
            >
              [ × ]
            </button>
          </div>
        </div>

        {/* ── PDF canvas area ── */}
        <div
          ref={containerRef}
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            background: "#0a0118",
            display: "flex", flexDirection: "column", alignItems: "center",
            padding: "24px 20px 16px",
            gap: "16px",
          }}
        >
          <Document
            file="/cv/ignacio-aristegui-cv.pdf"
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={
              <span style={{ color: "#c084fc", fontFamily: '"Pixel NES", monospace', fontSize: "11px", marginTop: "40px" }}>
                LOADING...
              </span>
            }
            error={
              <span style={{ color: "#ff6b8a", fontFamily: '"Pixel NES", monospace', fontSize: "11px", marginTop: "40px" }}>
                ERROR LOADING PDF
              </span>
            }
          >
            <div style={{
              boxShadow: "0 0 0 2px #6b21a8, 0 0 40px #c084fc22",
              borderRadius: "2px",
              overflow: "hidden",
            }}>
              <Page
                pageNumber={page}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </div>
          </Document>

          {/* ── Page navigation ── */}
          {numPages > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: "14px",
              background: "rgba(0,0,0,0.6)", border: "1px solid #3b0764",
              borderRadius: "4px", padding: "6px 14px",
            }}>
              <button
                style={page <= 1 ? btnDisabled : btnStyle}
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ← prev
              </button>
              <span style={{ color: "#c084fc", fontSize: "10px", letterSpacing: "1px", userSelect: "none" }}>
                {page} / {numPages}
              </span>
              <button
                style={page >= numPages ? btnDisabled : btnStyle}
                disabled={page >= numPages}
                onClick={() => setPage(p => Math.min(numPages, p + 1))}
              >
                next →
              </button>
            </div>
          )}
          {numPages > 1 && (
            <span style={{ color: "#3b0764", fontSize: "9px", fontFamily: '"Pixel NES", monospace', userSelect: "none" }}>
              ← → arrow keys also work
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
