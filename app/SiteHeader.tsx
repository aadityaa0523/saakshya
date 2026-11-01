"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MENUS } from "@/lib/site";
import { Icon } from "./Icons";
import { Translator } from "./Translator";
export function SiteHeader() {
  const pathname=usePathname();
  const [menu,setMenu]=useState<string|null>(null);
  const [mobile,setMobile]=useState(false);
  const [size,setSize]=useState(100);
  const header=useRef<HTMLElement>(null);
  useEffect(()=>{setMenu(null);setMobile(false);},[pathname]);
  useEffect(()=>{
    function outside(e:PointerEvent){if(!header.current?.contains(e.target as Node)){setMenu(null);setMobile(false);}}
    function escape(e:KeyboardEvent){if(e.key==='Escape'){
      const toggle=header.current?.querySelector<HTMLButtonElement>('.mobile-toggle');
      if(toggle?.offsetParent) toggle.focus();
      else (document.activeElement?.closest('.menu')?.querySelector('button') as HTMLButtonElement | null)?.focus();
      setMenu(null);setMobile(false);
    }}
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  function changeSize(value:number){setSize(value);document.documentElement.style.fontSize=`${value}%`;}
  return <>
    <div className="utility-bar no-print"><div className="site-width utility-inner"><p>Independent initiative <span>•</span> <strong>Not a government website</strong></p><div className="utility-tools"><Translator /><a href="#content">Skip to main content</a><span className="text-controls" aria-label="Text size"><button aria-label="Decrease text size" disabled={size<=90} onClick={()=>changeSize(size-10)}>A−</button><button aria-label="Reset text size" onClick={()=>changeSize(100)}>A</button><button aria-label="Increase text size" disabled={size>=120} onClick={()=>changeSize(size+10)}>A+</button></span><a className="utility-phone" href="tel:1930">Cyber fraud helpline: <strong>1930</strong></a></div></div></div>
    <header className="site-header no-print" ref={header}><div className="site-width header-inner">
      <Link href="/" className="brand" aria-label="Saakshya home"><span className="brand-mark"><Icon name="shield"/></span><span><span className="brand-name">Saakshya<span lang="hi">साक्ष्य</span></span><span className="brand-description">CYBERCRIME REPORT ASSISTANCE</span></span></Link>
      <nav id="primary-navigation" className={`primary-nav ${mobile?'is-open':''}`} aria-label="Main navigation"><Link href="/" className="nav-home" aria-current={pathname==='/'?'page':undefined}>Home</Link>
      {MENUS.map(([label,links],index)=><div className="menu" key={label}><button type="button" aria-expanded={menu===label} aria-controls={`nav-menu-${index}`} onClick={()=>setMenu(menu===label?null:label)}>{label==='Learn'?'Resources':label}<span className="chevron" aria-hidden="true"/></button>{menu===label&&<ul id={`nav-menu-${index}`}>{links.map(([name,href])=><li key={name}><Link href={href} {...(href.startsWith('http')?{target:'_blank',rel:'noreferrer'}:{})} onClick={()=>{setMenu(null);setMobile(false);}}>{name}{href.startsWith('http')&&<Icon name="external"/>}</Link></li>)}</ul>}</div>)}
      <Link href="/about" aria-current={pathname==='/about'?'page':undefined}>About us</Link><Link href="/reports" className="nav-reports"><Icon name="user"/> My reports</Link></nav>
      <button className="mobile-toggle" aria-expanded={mobile} aria-controls="primary-navigation" onClick={()=>setMobile(!mobile)}>{mobile?'Close ✕':'Menu ☰'}</button>
    </div></header>
  </>;
}
