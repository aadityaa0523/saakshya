"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LANGUAGES } from "@/lib/client";

type Written = { source: string; written: string };
const KEY = "saakshya-language";
const RTL = new Set(["Urdu", "Sindhi"]);
export const LANG_CODES: Record<string, string> = { English: "en", Hindi: "hi", Bengali: "bn", Marathi: "mr", Telugu: "te", Tamil: "ta", Gujarati: "gu", Urdu: "ur", Kannada: "kn", Odia: "or", Malayalam: "ml", Punjabi: "pa", Assamese: "as", Nepali: "ne", Sindhi: "sd" };
const ATTRIBUTES = ["placeholder", "aria-label"];

/**
 * Translates the site's own wording in place. Only exact matches from the dictionary change,
 * so a victim's story, drafts and law text are never touched.
 */
export function Translator() {
  const [language, setLanguage] = useState("English");
  const pathname = usePathname();
  const dictionary = useRef<Record<string, string>>({});
  const originals = useRef(new WeakMap<Node, Written>());
  const attributeOriginals = useRef(new WeakMap<Element, Record<string, Written>>());
  const observer = useRef<MutationObserver | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(KEY); } catch {}
    if (saved && LANG_CODES[saved]) setLanguage(saved);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const translateText = (node: Text) => {
      if (node.parentElement?.closest("textarea, script, style, [data-no-translate]")) return;
      const current = node.nodeValue ?? "";
      const known = originals.current.get(node);
      // A value that differs from what we last wrote came from the page, so it is the new original
      const source = known && current === known.written ? known.source : current;
      const translated = dictionary.current[source.trim()];
      const next = translated ? leading(source) + translated + trailing(source) : source;
      originals.current.set(node, { source, written: next });
      if (next !== current) node.nodeValue = next;
    };
    const translateElement = (element: Element) => {
      for (const name of ATTRIBUTES) {
        const current = element.getAttribute(name);
        if (current === null) continue;
        const stored = attributeOriginals.current.get(element) ?? {};
        const source = stored[name] && current === stored[name].written ? stored[name].source : current;
        const next = dictionary.current[source] ?? source;
        attributeOriginals.current.set(element, { ...stored, [name]: { source, written: next } });
        if (next !== current) element.setAttribute(name, next);
      }
    };
    const translateTree = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      translateElement(root as Element);
      (root as Element).querySelectorAll("*").forEach(translateElement);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateText(walker.currentNode as Text);
    };

    (async () => {
      dictionary.current = language === "English" ? {} : await fetch(`/i18n/${LANG_CODES[language]}.json`).then((response) => (response.ok ? response.json() : {})).catch(() => ({}));
      if (cancelled) return;
      document.documentElement.lang = LANG_CODES[language];
      document.documentElement.dir = RTL.has(language) ? "rtl" : "ltr";
      observer.current?.disconnect();
      translateTree(document.body);
      observer.current = new MutationObserver((mutations) => {
        observer.current?.disconnect();
        for (const mutation of mutations) {
          if (mutation.type === "characterData") translateTree(mutation.target);
          else if (mutation.type === "attributes") translateElement(mutation.target as Element);
          else mutation.addedNodes.forEach(translateTree);
        }
        observer.current?.observe(document.body, OBSERVED);
      });
      observer.current.observe(document.body, OBSERVED);
    })();
    return () => {
      cancelled = true;
      observer.current?.disconnect();
    };
  }, [language, pathname]);

  return (
    <label className="language-picker" data-no-translate>
      <span className="visually-hidden">Language</span>
      <select value={language} onChange={(event) => {
        setLanguage(event.target.value);
        try { localStorage.setItem(KEY, event.target.value); } catch {}
      }}>
        {LANGUAGES.map(([name, native]) => <option key={name} value={name}>{native}</option>)}
      </select>
    </label>
  );
}

const OBSERVED: MutationObserverInit = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES };
const leading = (text: string) => text.match(/^\s*/)?.[0] ?? "";
const trailing = (text: string) => text.match(/\s*$/)?.[0] ?? "";
