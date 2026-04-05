"use client";

import { useState, useEffect } from "react";

export default function TestSite() {
  const [isWidgetInjected, setIsWidgetInjected] = useState(false);

  useEffect(() => {
    const scriptId = "bariweb-widget-script";
    const widgetTag = "bariweb-widget"; // update this if your widget tag name is different
    
    if (isWidgetInjected) {
      // 1. Check if the element is ALREADY registered globally (due to Fast Refresh)
      if (window.customElements && window.customElements.get(widgetTag)) {
        let widgetRoot = document.querySelector(widgetTag) as HTMLElement;
        if (!widgetRoot) {
           // If the element was accidentally removed from the DOM but is still registered
           widgetRoot = document.createElement(widgetTag) as HTMLElement;
           document.body.appendChild(widgetRoot);
        }
        widgetRoot.style.display = "block";
      } 
      // 2. Otherwise, we inject the script cleanly
      else {
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.id = scriptId;
          script.src = "/bariweb.iife.js";
          script.setAttribute("data-key", "test-key-123");
          document.body.appendChild(script);
        } else {
          // Script is in DOM but maybe hasn't finished loading yet, just ensure it's visible if it mounts
          const widgetRoot = document.querySelector(widgetTag) as HTMLElement;
          if (widgetRoot) widgetRoot.style.display = "block";
        }
      }
    } else {
      // When toggled off, we DO NOT remove the script tag.
      // We purely hide the widget to safely preserve the Custom Elements global registry.
      const widgetRoot = document.querySelector(widgetTag) as HTMLElement;
      if (widgetRoot) {
        widgetRoot.style.display = "none";
      }
    }

    // CRITICAL: Do NOT return a cleanup function that removes the <script> or <bariweb-widget>.
    // Next.js Fast Refresh unmounts and remounts components constantly on save. 
    // If we remove the script, it gets re-injected, re-executed, and throws NotSupportedError.
  }, [isWidgetInjected]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative w-full pt-16 font-sans">
      
      {/* 
        ========================================================================
        FLOATING CONTROL PANEL (QA Harness)
        ========================================================================
      */}
      <div className="fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-700 shadow-xl z-[9999] p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
          <h1 className="text-white font-bold text-sm tracking-widest uppercase">
            BariWeb Widget QA Server
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-300 text-xs hidden sm:inline-block">
            Simulate Client Installation (Inject Widget)
          </span>
          <button
            onClick={() => setIsWidgetInjected(!isWidgetInjected)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              isWidgetInjected ? "bg-lime-500" : "bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isWidgetInjected ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-xs font-semibold w-24 ${isWidgetInjected ? "text-lime-400" : "text-slate-400"}`}>
            {isWidgetInjected ? "WIDGET ACTIVE" : "WIDGET OFF"}
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        MOCK BARI-SHOP SITE (Deliberately Poor Accessibility)
        ========================================================================
      */}
      <div className="flex-grow flex flex-col items-center w-full">
        
        {/* Header - Bad a11y: low contrast, very small text, ambiguous links */}
        <header className="w-full bg-white flex items-center justify-between p-3 shadow-sm border-b border-gray-100">
          <div className="text-gray-300 font-serif text-[10px] tracking-tighter">
            Bari-Shop Storefront
          </div>
          <nav className="flex gap-2">
            <a href="#" className="text-gray-200 text-[9px] hover:text-gray-400 transition-colors">clk hr</a>
            <a href="#" className="text-gray-200 text-[9px] hover:text-gray-400 transition-colors">inf</a>
            <a href="#" className="text-gray-200 text-[9px] hover:text-gray-400 transition-colors">abt</a>
          </nav>
        </header>

        {/* Hero Section - Bad a11y: bad heading hierarchy, low contrast, vague button text */}
        <section className="w-full bg-gray-100 py-16 px-4 flex flex-col items-center justify-center text-center">
          <h3 className="text-gray-400 text-xs font-light uppercase tracking-widest mb-2">
            Welcome to the shop
          </h3>
          <p className="text-gray-300 text-[11px] leading-tight max-w-sm mt-2">
            Buy things here. It is good. Click the buttons below to purchase the items in our store right now before they are out of stock.
          </p>
          <button className="mt-6 bg-gray-200 text-gray-400 px-4 py-2 text-[10px] uppercase border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-300 transition-colors">
            Click here
          </button>
        </section>

        {/* Products List - Bad a11y: no alt tags on images (simulated), missing headers, poor contrast, ambiguous buttons */}
        <main className="w-full max-w-4xl p-6 mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          
          <article className="bg-white border border-gray-50 p-3 flex flex-col items-center shadow-sm">
            {/* Div acting as an image, no role, no aria-label */}
            <div className="w-full h-40 bg-gray-100 mb-3 hover:opacity-80 transition-opacity"></div>
            <div className="text-gray-400 text-[10px] uppercase w-full text-left tracking-wider">Item 1</div>
            <div className="text-gray-300 text-[9px] w-full text-left mt-1">Super cool item.</div>
            <div className="text-gray-400 text-xs mt-3 w-full text-left font-bold">$99</div>
            <button className="w-full bg-gray-50 text-gray-300 text-[10px] py-2 mt-3 uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-colors">
              Buy
            </button>
          </article>

          <article className="bg-white border border-gray-50 p-3 flex flex-col items-center shadow-sm">
            <div className="w-full h-40 bg-gray-100 mb-3 hover:opacity-80 transition-opacity"></div>
            <div className="text-gray-400 text-[10px] uppercase w-full text-left tracking-wider">Item 2</div>
            <div className="text-gray-300 text-[9px] w-full text-left mt-1">Another neat thing to buy.</div>
            <div className="text-gray-400 text-xs mt-3 w-full text-left font-bold">$149</div>
            <button className="w-full bg-gray-50 text-gray-300 text-[10px] py-2 mt-3 uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-colors">
              Buy
            </button>
          </article>

          <article className="bg-white border border-gray-50 p-3 flex flex-col items-center shadow-sm">
            <div className="w-full h-40 bg-gray-100 mb-3 hover:opacity-80 transition-opacity"></div>
            <div className="text-gray-400 text-[10px] uppercase w-full text-left tracking-wider">Item 3</div>
            <div className="text-gray-300 text-[9px] w-full text-left mt-1">You definitely need this.</div>
            <div className="text-gray-400 text-xs mt-3 w-full text-left font-bold">$19</div>
            <button className="w-full bg-gray-50 text-gray-300 text-[10px] py-2 mt-3 uppercase tracking-widest border border-gray-100 hover:bg-gray-100 transition-colors">
              Buy
            </button>
          </article>

        </main>
      </div>

      {/* Footer - Bad a11y: completely illegible contrast, tiny text, ambiguous links */}
      <footer className="w-full bg-white p-6 mt-12 flex flex-col items-center border-t border-gray-50">
        <div className="text-gray-200 text-[8px] tracking-widest">
          Copyright Bari-Shop 2026. All rights reserved.
        </div>
        <div className="flex gap-4 mt-2">
          <span className="text-gray-200 text-[8px] uppercase cursor-pointer hover:text-gray-300">TOS</span>
          <span className="text-gray-200 text-[8px] uppercase cursor-pointer hover:text-gray-300">Privacy Policy</span>
        </div>
      </footer>
    </div>
  );
}
