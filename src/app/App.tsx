import { useState, useRef, useEffect } from "react";
import LoginPage from "./components/LoginPage";
import { api } from "./api/client";
import {
  Package, Users, Warehouse, Truck, BarChart2, UserCog, CreditCard,
  Settings, ChevronLeft, ChevronRight, RefreshCw, LogOut, KeyRound,
  Download, Printer, LayoutDashboard, Tags, Layers,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  TILE_COLORS, ALL_PRODUCTS, SAILORS_DATA, STOCK_DATA,
  SALE_REPORT_DATA, CONSOLE_REPORT_DATA, NEW_SALES_REPORT_DATA,
  RECHARGE_REPORT_DATA, REFUND_REPORT_DATA, CARD_REGISTRATION_DATA,
  LOST_CARD_DATA, VENDORS_DATA, INITIAL_USERS, INITIAL_SETTINGS, SAILOR_TYPES
} from "./mockData";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "pos"|"products"|"master"|"sailor"|"stock"|"vendor"|"reports"|"user"|"card"|"settings";
type Category = "ALL"|"LIQUOR"|"SOFT DRINKS"|"PARTY"|"PARTY FOOD"|"FOOD";

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant="primary", className="", type="button" }: {
  children:React.ReactNode; onClick?:()=>void;
  variant?:"primary"|"danger"|"neutral"|"dark"; className?:string; type?:"button"|"submit";
}) {
  const colors = { primary:"bg-[#3a8c2f]", danger:"bg-[#cc2222]", neutral:"bg-[#555]", dark:"bg-[#143322]" };
  return (
    <button type={type} onClick={onClick}
      className={`px-4 py-1.5 rounded font-semibold text-sm text-white cursor-pointer border-0 transition-opacity hover:opacity-90 active:opacity-75 ${colors[variant]} ${className}`}>
      {children}
    </button>
  );
}

function FI({ label, value, onChange, type="text", readOnly=false, required=false, placeholder="", className="" }: {
  label:string; value:string; onChange?:(v:string)=>void; type?:string; readOnly?:boolean; required?:boolean; placeholder?:string; className?:string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-white text-xs font-semibold">{label}{required&&<span className="text-red-300 ml-0.5">*</span>}</label>
      <input type={type} value={value} readOnly={readOnly} placeholder={placeholder} onChange={e=>onChange?.(e.target.value)}
        className="bg-white text-gray-900 text-sm px-2 py-1 rounded border-0 outline-none w-full"/>
    </div>
  );
}

function FS({ label, value, onChange, options, required=false }: {
  label:string; value:string; onChange:(v:string)=>void; options:string[]; required?:boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-white text-xs font-semibold">{label}{required&&<span className="text-red-300 ml-0.5">*</span>}</label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        className="bg-white text-gray-900 text-sm px-2 py-1 rounded border-0 outline-none w-full">
        {options.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Table({ cols, rows, onRowClick, selIdx }: {
  cols:{key:string;label:string}[];
  rows:Record<string,React.ReactNode>[];
  onRowClick?:(i:number)=>void;
  selIdx?:number;
}) {
  return (
    <div className="overflow-auto rounded border-2 border-white/40 shadow-lg" style={{maxHeight:380}}>
      <table className="w-full text-xs border-collapse min-w-max">
        <thead>
          <tr>
            {cols.map(c=>(
              <th key={c.key} className="bg-[#2d6a4f] text-white font-bold px-3 py-1.5 text-left whitespace-nowrap border border-white/20 sticky top-0">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} onClick={()=>onRowClick?.(i)}
              className="cursor-pointer border-b border-gray-200 transition-colors hover:bg-green-50"
              style={{backgroundColor:selIdx===i?"#d1fae5":i%2===0?"#ffffff":"#f0fdf4"}}>
              {cols.map(c=>(
                <td key={c.key} className="px-3 py-1 text-gray-800 whitespace-nowrap border-r border-gray-200">
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon:React.ReactNode; title:string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-green-300 text-2xl">{icon}</span>
      <h1 className="text-white text-xl font-bold tracking-wide">{title}</h1>
    </div>
  );
}

// ─── POS Screen ───────────────────────────────────────────────────────────────
type OrderItem = { code:string; name:string; qty:number; price:number; qtyType:string };

interface POSProps {
  products:any[]; setProducts:React.Dispatch<React.SetStateAction<any[]>>;
  sailors:any[];  setSailors:React.Dispatch<React.SetStateAction<any[]>>;
  salesReport:any[];    setSalesReport:React.Dispatch<React.SetStateAction<any[]>>;
  consoleReport:any[];  setConsoleReport:React.Dispatch<React.SetStateAction<any[]>>;
  newSalesReport:any[]; setNewSalesReport:React.Dispatch<React.SetStateAction<any[]>>;
}

function POSScreen({ products, setProducts, sailors, setSailors,
  salesReport, setSalesReport, consoleReport, setConsoleReport,
  newSalesReport, setNewSalesReport }: POSProps) {

  const [activeCat, setActiveCat] = useState<Category>("LIQUOR");
  const [selectShip, setSelectShip] = useState("Others");
  const [bookingDate] = useState(new Date().toLocaleDateString("en-GB"));
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // ── Checkout popup ──
  const [showCheckout, setShowCheckout] = useState(false);
  const [popupCard, setPopupCard]       = useState("");
  const [popupSailor, setPopupSailor]   = useState<any|null>(null);
  const [popupError, setPopupError]     = useState("");
  // ref keeps the matched sailor always in sync (avoids stale-closure bugs)
  const popupSailorRef = useRef<any|null>(null);

  // ── Receipt popup ──
  const [receipt, setReceipt] = useState<null|{
    billNo:string; orderNo:string; sailor:any;
    items:OrderItem[]; total:number; date:string;
  }>(null);

  const categories: Category[] = ["ALL","LIQUOR","SOFT DRINKS","PARTY","PARTY FOOD","FOOD"];
  const catColors: Record<Category,string> = {
    ALL:"#4f86c6", LIQUOR:"#5b8dd9", "SOFT DRINKS":"#3db48c",
    PARTY:"#c46db0", "PARTY FOOD":"#d4884a", FOOD:"#7ab648",
  };

  const filtered = activeCat==="ALL" ? products : products.filter(p=>p.category===activeCat);
  const grandTotal = orderItems.reduce((s,i)=>s+i.qty*i.price, 0);

  // ── Cart helpers ──
  function addToOrder(p:any) {
    const inCart = orderItems.find(i=>i.code===p.code)?.qty ?? 0;
    if (p.stock<=inCart) { toast.error(`Out of stock! Only ${p.stock} available.`); return; }
    setOrderItems(prev=>{
      const idx=prev.findIndex(i=>i.code===p.code);
      if(idx>=0){ const n=[...prev]; n[idx]={...n[idx],qty:n[idx].qty+1}; return n; }
      return [...prev,{code:p.code,name:p.name,qty:1,price:p.price,qtyType:p.sub||"BOTTLE"}];
    });
  }
  function removeItem(idx:number){ setOrderItems(prev=>prev.filter((_,i)=>i!==idx)); }
  function clearOrder(){ setOrderItems([]); }

  // ── Open checkout popup ──
  function openCheckout() {
    if(orderItems.length===0){ toast.error("No items in cart!"); return; }
    setPopupCard(""); setPopupSailor(null); setPopupError("");
    setShowCheckout(true);
  }

  // ── Live card lookup inside popup ──
  function handlePopupCardChange(val:string) {
    setPopupCard(val); setPopupError("");
    const found=sailors.find((s:any)=>s.id===val||s.pNo===val||s.mobile===val)||null;
    setPopupSailor(found);
    popupSailorRef.current = found; // always up-to-date, no stale closure
  }

  // ── Confirm payment ──
  async function confirmPayment() {
    const sailor = popupSailorRef.current;
    if(!sailor){ setPopupError("Card not found. Try Sailor ID, P.No or Mobile."); return; }
    if(sailor.status==="Deactive"){ setPopupError("Card is DEACTIVATED. Transaction blocked."); return; }
    if(sailor.status==="Lost"){ setPopupError("Card is reported LOST. Transaction blocked."); return; }
    if(grandTotal>sailor.balance){
      setPopupError(`Insufficient balance! Need ₹${grandTotal.toFixed(2)}, Available ₹${sailor.balance.toFixed(2)}`);
      return;
    }

    try {
      const res = await api.checkout(popupCard, selectShip, orderItems);
      
      // Update local state from server result
      setProducts(prev=>prev.map(p=>{
        const o=orderItems.find(x=>x.code===p.code);
        return o?{...p,stock:Math.max(0,p.stock-o.qty)}:p;
      }));

      setSailors(prev=>prev.map(s=>
        s.id===sailor.id?{...s,balance:res.remainingBalance}:s
      ));

      setReceipt({ billNo: res.billNo, orderNo: res.orderNo, sailor: res.sailor, items:[...orderItems], total:grandTotal, date: res.date });
      setShowCheckout(false);
      popupSailorRef.current = null;
      clearOrder();
    } catch (err: any) {
      setPopupError(err.message || "Payment transaction failed.");
    }
  }

  return (
    <div className="flex flex-col h-full gap-0">

      {/* ── Receipt / Success Popup ── */}
      {receipt&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:"rgba(0,0,0,0.75)"}}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden">

            {/* Green success header */}
            <div className="bg-[#1a7a3c] px-6 pt-5 pb-4 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white text-3xl">✓</span>
              </div>
              <h2 className="text-white font-extrabold text-xl tracking-wide">Payment Successful!</h2>
              <p className="text-white/70 text-xs mt-1">{receipt.date}</p>
            </div>

            {/* Order number band */}
            <div className="bg-[#f0fdf4] border-b border-green-200 px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">Order Number</p>
                <p className="text-green-700 font-extrabold text-2xl tracking-wider">{receipt.orderNo}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-semibold">Bill No</p>
                <p className="text-gray-600 font-semibold text-xs">{receipt.billNo}</p>
              </div>
            </div>

            {/* Customer info */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <Users size={18} className="text-green-700"/>
              </div>
              <div>
                <p className="text-gray-800 font-bold text-sm">{receipt.sailor.name}</p>
                <p className="text-gray-400 text-xs">{receipt.sailor.rank} · {receipt.sailor.unit} · {receipt.sailor.type}</p>
              </div>
            </div>

            {/* Items */}
            <div className="px-6 py-3 max-h-44 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-gray-400 font-semibold pb-1">Item</th>
                    <th className="text-center text-gray-400 font-semibold pb-1">Qty</th>
                    <th className="text-right text-gray-400 font-semibold pb-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item,i)=>(
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-700 font-medium">{item.name}</td>
                      <td className="py-1.5 text-center text-gray-500">{item.qty} {item.qtyType}</td>
                      <td className="py-1.5 text-right text-gray-700 font-semibold">₹{(item.qty*item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="px-6 py-3 bg-green-50 border-t-2 border-green-200 flex justify-between items-center">
              <span className="text-gray-600 font-bold text-sm">Grand Total Paid</span>
              <span className="text-green-700 font-extrabold text-xl">₹{receipt.total.toFixed(2)}</span>
            </div>

            {/* Balance remaining */}
            <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-semibold">Remaining Balance</span>
              <span className="text-gray-600 font-bold">₹{(receipt.sailor.balance - receipt.total).toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={()=>{
                  const w=window.open("","_blank","width=400,height=600");
                  if(!w) return;
                  w.document.write(`<html><head><title>Receipt ${receipt.orderNo}</title><style>body{font-family:monospace;padding:20px;max-width:320px;margin:auto}h2{text-align:center}hr{border:1px dashed #ccc}.row{display:flex;justify-content:space-between;margin:4px 0}.total{font-weight:bold;font-size:1.1em;border-top:2px solid #000;padding-top:6px}.center{text-align:center;color:#555;font-size:.85em}</style></head><body><h2>PAYMENT RECEIPT</h2><p class='center'>${receipt.date}</p><hr><p class='center'><b>Order No: ${receipt.orderNo}</b><br>Bill: ${receipt.billNo}</p><hr><p><b>${receipt.sailor.name}</b><br>${receipt.sailor.rank} · ${receipt.sailor.unit}</p><hr>${receipt.items.map(it=>`<div class='row'><span>${it.name} ×${it.qty}</span><span>&#x20B9;${(it.qty*it.price).toFixed(2)}</span></div>`).join('')}<hr><div class='row total'><span>Grand Total</span><span>&#x20B9;${receipt.total.toFixed(2)}</span></div><hr><p class='center'>Thank You!</p></body></html>`);
                  w.document.close(); w.print();
                }}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-1.5">
                <Printer size={14}/> Print
              </button>
              <button onClick={()=>setReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#1a7a3c] text-white text-sm font-bold hover:bg-green-600 transition">
                ✓ Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout Popup ── */}
      {showCheckout&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:"rgba(0,0,0,0.7)"}}>
          <div className="bg-[#0d2b1a] border-2 border-green-500/60 rounded-2xl shadow-2xl w-[440px] overflow-hidden">

            {/* Header */}
            <div className="bg-[#143322] px-5 py-3 flex items-center justify-between border-b border-green-500/30">
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <CreditCard size={16} className="text-green-400"/> Card Payment
                </h2>
                <p className="text-white/50 text-xs mt-0.5">Scan or type the card number to complete payment</p>
              </div>
              <button onClick={()=>setShowCheckout(false)} className="text-white/40 hover:text-white text-2xl font-bold leading-none">✕</button>
            </div>

            <div className="px-5 pt-4 pb-2">
              {/* Order summary */}
              <div className="bg-black/25 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
                {orderItems.map((item,i)=>(
                  <div key={i} className="flex justify-between text-xs text-white/80 py-0.5">
                    <span className="truncate">{item.name} × {item.qty}</span>
                    <span className="font-semibold ml-3 flex-shrink-0">₹{(item.qty*item.price).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-white/20 mt-2 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Grand Total</span>
                  <span className="text-green-400 text-base">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Card input */}
              <label className="text-white/60 text-xs font-semibold block mb-1 uppercase tracking-wide">
                Card Number / P.No / Mobile
              </label>
              <input
                autoFocus
                value={popupCard}
                onChange={e=>handlePopupCardChange(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&confirmPayment()}
                placeholder="e.g. 0001777486 or 44361W or 9812345678"
                className={`w-full font-bold text-lg px-4 py-2.5 rounded-xl border-2 outline-none transition ${
                  popupSailor
                    ? "bg-white text-gray-900 border-green-500"
                    : popupCard.length > 0
                      ? "bg-red-50 text-gray-900 border-red-400"
                      : "bg-white text-gray-900 border-transparent focus:border-green-500"
                }`}
              />
              {/* Not found hint */}
              {popupCard.length > 0 && !popupSailor && (
                <p className="mt-1.5 text-red-400 text-xs font-semibold flex items-center gap-1">
                  <span>✕</span> No card found for &ldquo;{popupCard}&rdquo;. Try the 10-digit ID, P.No or Mobile.
                </p>
              )}
              {/* Found confirmation */}
              {popupSailor && (
                <p className="mt-1.5 text-green-400 text-xs font-semibold flex items-center gap-1">
                  <span>✓</span> Card matched
                </p>
              )}

              {/* Customer card */}
              {popupSailor&&(
                <div className={`mt-3 rounded-xl px-4 py-3 flex items-center gap-3 ${
                  popupSailor.status==="Active"?"bg-green-900/40 border border-green-500/40":"bg-red-900/40 border border-red-500/40"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{popupSailor.name}</p>
                    <p className="text-white/60 text-xs">{popupSailor.rank} · {popupSailor.unit}</p>
                    <p className="text-white/50 text-xs">{popupSailor.type}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-white/50 mb-0.5">Balance</p>
                    <p className={`font-bold text-xl leading-none ${popupSailor.balance>=grandTotal?"text-green-400":"text-red-400"}`}>
                      ₹{popupSailor.balance.toFixed(2)}
                    </p>
                    {popupSailor.status!=="Active"&&(
                      <span className="text-red-400 text-[10px] font-bold block mt-1">{popupSailor.status}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {popupError&&(
                <div className="mt-3 bg-red-900/40 border border-red-500/40 rounded-xl px-3 py-2 text-red-300 text-xs font-semibold">
                  ⚠ {popupError}
                </div>
              )}

              {/* Balance after payment preview */}
              {popupSailor&&popupSailor.status==="Active"&&popupSailor.balance>=grandTotal&&(
                <p className="mt-2 text-center text-xs text-white/40">
                  Balance after payment: <span className="text-white/60 font-semibold">₹{(popupSailor.balance-grandTotal).toFixed(2)}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-5 py-4 flex gap-3">
              <button onClick={()=>setShowCheckout(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/70 text-sm font-semibold hover:bg-white/10 transition">
                Cancel
              </button>
              <button onClick={confirmPayment}
                disabled={!popupSailor||popupSailor.status!=="Active"||grandTotal>popupSailor.balance}
                title={
                  !popupSailor ? "Enter a valid card number first" :
                  popupSailor.status!=="Active" ? `Card is ${popupSailor.status}` :
                  grandTotal>popupSailor.balance ? "Insufficient balance" : ""
                }
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition ${
                  popupSailor&&popupSailor.status==="Active"&&grandTotal<=popupSailor.balance
                    ?"bg-green-600 hover:bg-green-500 active:scale-95 shadow-lg shadow-green-900/50"
                    :"bg-green-900/30 text-white/30 cursor-not-allowed"
                }`}>
                {!popupSailor
                  ? "Enter Card Number"
                  : popupSailor.status!=="Active"
                    ? `Card ${popupSailor.status}`
                    : grandTotal>popupSailor.balance
                      ? "Insufficient Balance"
                      : `✓ Confirm Payment  ₹${grandTotal.toFixed(2)}`
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Categories bar ── */}
      <div className="flex items-center gap-1 px-2 py-1.5 bg-[#071a0d] border-b border-white/20 flex-shrink-0">
        <span className="text-white text-xs font-bold mr-2">Categories</span>
        <button className="text-white/60 hover:text-white"><ChevronLeft size={16}/></button>
        {categories.map(c=>(
          <button key={c} onClick={()=>setActiveCat(c)}
            style={{backgroundColor:activeCat===c?catColors[c]:"rgba(255,255,255,0.1)"}}
            className="px-4 py-1 rounded text-white text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap">
            {c}
          </button>
        ))}
        <button className="text-white/60 hover:text-white ml-1"><ChevronRight size={16}/></button>
      </div>

      {/* ── Main body ── */}
      <div className="flex flex-1 min-h-0 gap-2 p-2">

        {/* Product grid */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-1.5 overflow-y-auto pr-1">
          <div className="text-white text-xs font-bold text-center mb-1">
            Products &nbsp;<span className="bg-white/20 px-2 py-0.5 rounded text-[10px]">All Products</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {filtered.map((p,i)=>(
              <button key={p.code} onClick={()=>addToOrder(p)}
                style={{backgroundColor:TILE_COLORS[i%TILE_COLORS.length]}}
                className="p-1.5 rounded text-gray-800 text-[10px] font-bold text-center leading-tight hover:opacity-85 active:scale-95 transition-all min-h-[44px] flex flex-col items-center justify-center">
                <span className="truncate w-full">{p.name}</span>
                <span className="text-[8px] opacity-60">₹{p.price} · Stock:{p.stock}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Order area */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Ship / Date */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-white text-xs font-semibold">Select Ship</span>
            <select value={selectShip} onChange={e=>setSelectShip(e.target.value)}
              className="bg-white text-gray-800 text-xs px-2 py-1 rounded w-32">
              {["Others","INS DELHI","INS VIKRANT","INS KOLKATA","INS MYSORE","INS SHIVALIK"].map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="text-white text-xs font-semibold">Booking Date</span>
            <input value={bookingDate} readOnly className="bg-white text-gray-800 text-xs px-2 py-1 rounded w-28"/>
          </div>

          {/* Cart table */}
          <div className="flex-1 bg-white rounded overflow-auto min-h-0">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#2d6a4f]">
                  {["Item Description","Qty","Price","Qty Type","Amount",""].map(h=>(
                    <th key={h} className="text-white font-bold px-2 py-1.5 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item,i)=>(
                  <tr key={i} className={i%2===0?"bg-white":"bg-gray-50"}>
                    <td className="px-2 py-1 text-gray-800 font-medium">{item.name}</td>
                    <td className="px-2 py-1 text-gray-800">
                      <div className="flex items-center gap-1">
                        <button onClick={()=>setOrderItems(p=>{const n=[...p];if(n[i].qty>1)n[i]={...n[i],qty:n[i].qty-1};else n.splice(i,1);return n;})}
                          className="w-5 h-5 bg-gray-200 rounded font-bold text-gray-700 hover:bg-gray-300 flex items-center justify-center">−</button>
                        <span className="w-6 text-center font-semibold">{item.qty}</span>
                        <button onClick={()=>{
                          const orig=products.find(p=>p.code===item.code);
                          if(orig&&orig.stock<=item.qty){toast.error("Not enough stock!");return;}
                          setOrderItems(p=>{const n=[...p];n[i]={...n[i],qty:n[i].qty+1};return n;});
                        }} className="w-5 h-5 bg-gray-200 rounded font-bold text-gray-700 hover:bg-gray-300 flex items-center justify-center">+</button>
                      </div>
                    </td>
                    <td className="px-2 py-1 text-gray-800">₹{item.price.toFixed(2)}</td>
                    <td className="px-2 py-1 text-gray-800">{item.qtyType}</td>
                    <td className="px-2 py-1 text-gray-800 font-semibold">₹{(item.qty*item.price).toFixed(2)}</td>
                    <td className="px-2 py-1">
                      <button onClick={()=>removeItem(i)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
                    </td>
                  </tr>
                ))}
                {orderItems.length===0&&(
                  <tr><td colSpan={6} className="text-center text-gray-400 py-10 text-xs">
                    Click any product tile on the left to add items to the cart.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals + actions */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <span className="text-white font-bold text-sm">Grand Total: </span>
              <span className="text-green-400 font-bold text-lg">₹{grandTotal.toFixed(2)}</span>
              <span className="text-white/50 text-xs ml-3">{orderItems.reduce((s,i)=>s+i.qty,0)} item(s)</span>
            </div>
            <div className="flex gap-2">
              <Btn variant="neutral" onClick={clearOrder}>Clear</Btn>
              <Btn variant="primary" onClick={openCheckout}>
                <span className="flex items-center gap-1.5"><CreditCard size={14}/> Order & Pay</span>
              </Btn>
              <Btn variant="danger" onClick={clearOrder}>Cancel</Btn>
            </div>
          </div>
        </div>

        {/* Live stock panel */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-1">
          <div className="text-white text-[10px] font-bold text-center bg-[#2d6a4f] py-1 rounded mb-0.5">Live Stock</div>
          <div className="bg-white rounded overflow-auto flex-1" style={{maxHeight:"100%"}}>
            <table className="w-full text-[10px] border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-[#2d6a4f]">
                  <th className="text-white font-bold px-2 py-1 text-left">Item</th>
                  <th className="text-white font-bold px-1 py-1 text-right">Qty</th>
                </tr>
              </thead>
              <tbody>
                {products.slice(0,40).map((p,i)=>(
                  <tr key={p.code} style={{backgroundColor:i%2===0?"#fff":"#f0f9ff"}}>
                    <td className="px-2 py-0.5 text-gray-800 truncate max-w-[100px]">{p.name}</td>
                    <td className={`px-1 py-0.5 text-right font-semibold ${p.stock<10?"text-red-500":"text-gray-700"}`}>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Product Details ──────────────────────────────────────────────────────────
function ProductDetails({ products, setProducts, categories = [], brands = [], onNavigateTo }: { products:any[]; setProducts:any; categories?:any[]; brands?:any[]; onNavigateTo:(s:Screen)=>void }) {
  const [code,setCode]=useState(""); const [name,setName]=useState("");
  const [category,setCategory]=useState("LIQUOR"); const [subCategory,setSubCategory]=useState("WHISKY");
  const [brand,setBrand]=useState("ROYAL STAG"); const [price,setPrice]=useState("0"); const [alertQty,setAlertQty]=useState("10");
  const [search,setSearch]=useState(""); const [selected,setSelected]=useState<number|undefined>();

  const categoryOptions = categories && categories.length > 0
    ? categories.map((c: any) => c.name)
    : ["LIQUOR", "FOOD", "SOFT DRINKS", "PARTY FOOD", "SNACKS"];

  const activeCatObj = categories.find((c: any) => c.name.toUpperCase() === category.toUpperCase());
  const availableSubCategories = activeCatObj && activeCatObj.subCategories && activeCatObj.subCategories.length > 0
    ? activeCatObj.subCategories.map((s: any) => s.name)
    : (
        category === "LIQUOR" ? ["WHISKY", "BEER", "RUM", "VODKA", "WINE", "BRANDY"] :
        category === "FOOD" ? ["BREAD/ROTI", "VEGETARIAN", "NON VEGETARIAN", "DESSERTS"] :
        category === "SOFT DRINKS" ? ["COLD DRINK", "ENERGY DRINK"] :
        category === "PARTY FOOD" ? ["PARTY VEG", "PARTY NONVEG"] :
        ["GENERAL"]
      );

  const brandOptions = brands && brands.length > 0
    ? brands.filter((b: any) => !b.categoryName || b.categoryName.toUpperCase() === category.toUpperCase() || category === "ALL").map((b: any) => b.name)
    : availableSubCategories;

  function handleCategoryChange(newCat: string) {
    setCategory(newCat);
    const catObj = categories.find((c: any) => c.name.toUpperCase() === newCat.toUpperCase());
    let subs: string[] = [];
    if (catObj && catObj.subCategories && catObj.subCategories.length > 0) {
      subs = catObj.subCategories.map((s: any) => s.name);
    } else if (newCat === "LIQUOR") subs = ["WHISKY", "BEER", "RUM", "VODKA", "WINE", "BRANDY"];
    else if (newCat === "FOOD") subs = ["BREAD/ROTI", "VEGETARIAN", "NON VEGETARIAN", "DESSERTS"];
    else if (newCat === "SOFT DRINKS") subs = ["COLD DRINK", "ENERGY DRINK"];
    else if (newCat === "PARTY FOOD") subs = ["PARTY VEG", "PARTY NONVEG"];
    else subs = ["GENERAL"];

    const firstSub = subs[0] || "GENERAL";
    setSubCategory(firstSub);
    setBrand(brandOptions[0] || firstSub);
  }

  const filtered=products.filter((r:any)=>
    r.code.toLowerCase().includes(search.toLowerCase())||
    r.name.toLowerCase().includes(search.toLowerCase())||
    r.category.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate(){
    if(!code||!name){ toast.error("Code and Name are required!"); return; }
    if(products.some((p:any)=>p.code===code)){ toast.error("Product Code already exists!"); return; }
    const newProd = {code,name,category,sub:subCategory,price:Number(price)||0,stock:0,alertQty:Number(alertQty)||10};
    try {
      await api.createProduct(newProd);
    } catch(e:any) { console.warn("API fallback:", e); }
    setProducts((prev:any)=>[newProd,...prev]);
    toast.success(`Product ${name} created!`); handleClear();
  }
  async function handleUpdate(){
    if(selected===undefined) return;
    const orig=filtered[selected];
    const updated = {code,name,category,sub:subCategory,price:Number(price)||0,stock:orig.stock||0,alertQty:Number(alertQty)||10};
    try {
      await api.updateProduct(orig.code, updated);
    } catch(e:any) { console.warn("API fallback:", e); }
    setProducts((prev:any)=>prev.map((p:any)=>p.code===orig.code?updated:p));
    toast.success("Product updated!"); handleClear();
  }
  async function handleDelete(){
    if(selected===undefined) return;
    const orig=filtered[selected];
    try {
      await api.deleteProduct(orig.code);
    } catch(e:any) { console.warn("API fallback:", e); }
    setProducts((prev:any)=>prev.filter((p:any)=>p.code!==orig.code));
    toast.success("Product deleted!"); handleClear();
  }
  function handleClear(){setCode("");setName("");handleCategoryChange(categoryOptions[0]||"LIQUOR");setPrice("0");setAlertQty("10");setSelected(undefined);}
  function handleRowClick(i:number){setSelected(i);const r=filtered[i];setCode(r.code);setName(r.name);setCategory(r.category);setSubCategory(r.sub);setBrand(r.sub);setPrice(String(r.price||0));setAlertQty(String(r.alertQty||10));}

  return (
    <div>
      <SectionTitle icon={<Package size={22}/>} title="Product Details"/>
      <div className="bg-[#143322] rounded-lg p-4 mb-4 border border-white/30">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <FI label="Code" value={code} onChange={setCode} required/>
          <FI label="Name" value={name} onChange={setName} required/>
          <FS label="Category" value={category} onChange={handleCategoryChange} options={categoryOptions} required/>
          <FS label="Sub Category" value={subCategory} onChange={setSubCategory} options={availableSubCategories} required/>
          <FS label="Brand" value={brand} onChange={setBrand} options={brandOptions.length > 0 ? brandOptions : availableSubCategories}/>
          <FI label="Sale Price (₹)" value={price} onChange={setPrice} type="number" required/>
          <FI label="Alert Quantity" value={alertQty} onChange={setAlertQty} required/>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          {selected!==undefined&&<Btn variant="primary" onClick={handleUpdate}>Update</Btn>}
          {selected!==undefined&&<Btn variant="danger" onClick={handleDelete}>Delete</Btn>}
          <Btn variant="neutral" onClick={handleClear}>Clear</Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-white text-sm font-semibold">Search</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} className="bg-white text-gray-900 text-sm px-2 py-1 rounded w-40" placeholder="Search..."/>
          </div>
        </div>
      </div>
      <Table cols={[{key:"code",label:"Product Code"},{key:"name",label:"Product Name"},{key:"category",label:"Category"},{key:"sub",label:"Sub Category"},{key:"alertQty",label:"Alert Qty"},{key:"price",label:"Sale Price"}]}
        rows={filtered.map((r:any)=>({...r,price:`₹${r.price.toFixed(2)}`}))}
        onRowClick={handleRowClick} selIdx={selected}/>
    </div>
  );
}

// ─── Sailor Details ───────────────────────────────────────────────────────────
function SailorDetails({ sailors, setSailors, cardRegistration, setCardRegistration, onNavigateTo }: any) {
  const [sailorId,setSailorId]=useState(""); const [sailorName,setSailorName]=useState("");
  const [address,setAddress]=useState(""); const [mobileNo,setMobileNo]=useState("");
  const [regRefund,setRegRefund]=useState("50"); const [dob,setDob]=useState("12/05/1985");
  const [sailorPNo,setSailorPNo]=useState(""); const [rank,setRank]=useState("");
  const [unit,setUnit]=useState(""); const [sailorType,setSailorType]=useState("JUNIOR SAILOR");
  const [printBill,setPrintBill]=useState(false);
  const [selected,setSelected]=useState<number|undefined>();
  const [searchQ,setSearchQ]=useState(""); const [showSearch,setShowSearch]=useState(false);
  const [photoUrl,setPhotoUrl]=useState<string|null>(null);
  const [isCapturing,setIsCapturing]=useState(false);

  const filteredSailors=sailors.filter((s:any)=>
    s.name.toLowerCase().includes(searchQ.toLowerCase())||
    s.pNo.toLowerCase().includes(searchQ.toLowerCase())||
    s.mobile.includes(searchQ));

  function loadSailor(s:any){
    setSailorId(s.id);setSailorName(s.name);setAddress(s.address);setMobileNo(s.mobile);
    setRegRefund(String(s.regRefund));setDob(s.dob);setSailorPNo(s.pNo);setRank(s.rank);
    setUnit(s.unit);setSailorType(s.type);setShowSearch(false);
    setPhotoUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${s.id}`);
  }
  function handleClear(){setSailorId("");setSailorName("");setAddress("");setMobileNo("");setRegRefund("50");setDob("12/05/1985");setSailorPNo("");setRank("");setUnit("");setSailorType("JUNIOR SAILOR");setPrintBill(false);setSelected(undefined);setPhotoUrl(null);}
  async function handleCreate(){
    if(!sailorPNo||!sailorName||!mobileNo){ toast.error("P.No, Name, and Mobile are required!"); return; }
    if(sailors.some((s:any)=>s.pNo===sailorPNo)){ toast.error("Sailor with this P.No already exists!"); return; }
    const newId=sailorId||"000"+Math.floor(1000000+Math.random()*9000000);
    const newSailor={id:newId,name:sailorName,mobile:mobileNo,pNo:sailorPNo,rank,unit,type:sailorType,address,dob,regRefund:Number(regRefund)||50,balance:Number(regRefund)||50,status:"Active"};
    try {
      await api.createSailor(newSailor);
    } catch(e:any) { console.warn("API fallback:", e); }
    setSailors((prev:any)=>[newSailor,...prev]);
    const regTx="REG-TRN"+Math.floor(10000000+Math.random()*90000000);
    setCardRegistration((prev:any)=>[{sno:prev.length+1,customerId:newId,transactionNo:regTx,name:sailorName,pNo:sailorPNo,category:sailorType,uniqueId:`MCPO-${Math.floor(100+Math.random()*900)}`,rank,deposit:Number(regRefund)||50},...prev]);
    toast.success("Sailor registered!"); handleClear();
  }
  async function handleUpdate(){
    if(selected===undefined&&!sailorId) return;
    const targetId = sailorId || (selected !== undefined ? sailors[selected]?.id : "");
    if(!targetId) return;
    const updated = {id:targetId,name:sailorName,mobile:mobileNo,pNo:sailorPNo,rank,unit,type:sailorType,address,dob,regRefund:Number(regRefund)||50,status:"Active"};
    try {
      await api.updateSailor(targetId, updated);
    } catch(e:any) { console.warn("API fallback:", e); }
    setSailors((prev:any)=>prev.map((s:any)=>s.id===targetId?{...s,...updated}:s));
    toast.success("Sailor updated!"); handleClear();
  }
  async function handleDelete(){
    if(selected===undefined&&!sailorId) return;
    const targetId = sailorId || (selected !== undefined ? sailors[selected]?.id : "");
    if(!targetId) return;
    try {
      await api.deleteSailor(targetId);
    } catch(e:any) { console.warn("API fallback:", e); }
    setSailors((prev:any)=>prev.filter((s:any)=>s.id!==targetId));
    toast.success("Sailor deleted!"); handleClear();
  }
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function openWebcam(){
    setShowWebcamModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch(err) {
      toast.error("Unable to access camera. Please allow webcam permissions.");
      setShowWebcamModal(false);
    }
  }

  function stopWebcam(){
    if(streamRef.current){
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowWebcamModal(false);
  }

  function capturePhoto(){
    if(videoRef.current){
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext("2d");
      if(ctx){
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setPhotoUrl(dataUrl);
        toast.success("Photo captured!");
      }
    }
    stopWebcam();
  }

  return (
    <div>
      <SectionTitle icon={<Users size={22}/>} title="Sailor Details"/>
      <div className="bg-[#143322] rounded-lg p-4 border border-white/30">
        <div className="flex gap-6">
          <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3">
            <FI label="Sailor ID" value={sailorId} onChange={setSailorId}/>
            <div className="flex flex-col gap-0.5">
              <label className="text-white text-xs font-semibold">Sailor P No <span className="text-red-300">*</span></label>
              <div className="flex gap-2">
                <input value={sailorPNo} onChange={e=>setSailorPNo(e.target.value)} className="bg-white text-gray-900 text-sm px-2 py-1 rounded flex-1"/>
                <button onClick={()=>setShowSearch(true)} className="bg-[#cc2222] text-white text-xs font-bold px-3 py-1 rounded hover:opacity-90 whitespace-nowrap">Search Sailor</button>
              </div>
            </div>
            <FI label="Sailor Name" value={sailorName} onChange={setSailorName} required/>
            <FI label="Rank" value={rank} onChange={setRank} required/>
            <FI label="Address" value={address} onChange={setAddress}/>
            <FI label="Unit" value={unit} onChange={setUnit}/>
            <FI label="Mobile No." value={mobileNo} onChange={setMobileNo} required/>
            <FS label="Sailor Type" value={sailorType} onChange={setSailorType} options={SAILOR_TYPES}/>
            <FI label="Reg Refund Deposit" value={regRefund} onChange={setRegRefund}/>
            <FI label="DOB" value={dob} onChange={setDob}/>
          </div>
          <div className="w-48 flex flex-col items-center gap-3 flex-shrink-0">
            <p className="text-white text-sm font-bold">Customer Photo</p>
            <div className="w-36 h-32 bg-white/20 rounded border-2 border-white/40 flex items-center justify-center overflow-hidden">
              {isCapturing
                ?<div className="text-white text-xs text-center animate-pulse flex flex-col items-center gap-1"><RefreshCw size={24} className="animate-spin"/>Capturing...</div>
                :photoUrl?<img src={photoUrl} className="w-full h-full object-cover" alt="Sailor"/>
                :<div className="flex flex-col items-center gap-1 text-white/40"><Users size={40}/><span className="text-xs">No Photo</span></div>
              }
            </div>
            <button onClick={openWebcam} className="bg-[#3a8c2f] text-white text-xs px-4 py-1.5 rounded w-full cursor-pointer hover:bg-green-600 font-bold transition flex items-center justify-center gap-1.5">📷 Capture Photo</button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center gap-1.5 text-white text-sm cursor-pointer">
            <input type="checkbox" checked={printBill} onChange={e=>setPrintBill(e.target.checked)} className="accent-green-500"/>Print Bill
          </label>
          <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          {selected!==undefined&&<Btn variant="primary" onClick={handleUpdate}>Update</Btn>}
          {selected!==undefined&&<Btn variant="danger" onClick={handleDelete}>Delete</Btn>}
          <Btn variant="neutral" onClick={handleClear}>Clear</Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-white text-sm font-bold mb-2">Registered Sailors Directory</h3>
        <Table cols={[
          {key:"id",label:"Sailor ID"},
          {key:"name",label:"Name"},
          {key:"pNo",label:"P.No"},
          {key:"rank",label:"Rank"},
          {key:"unit",label:"Unit"},
          {key:"type",label:"Sailor Type"},
          {key:"mobile",label:"Mobile"},
          {key:"balance",label:"Balance (₹)"},
          {key:"status",label:"Status"}
        ]}
        rows={sailors.map((s: any) => ({
          ...s,
          balance: `₹${Number(s.balance).toFixed(2)}`,
          status: <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.status === 'Active' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}>{s.status}</span>
        }))}
        onRowClick={i => { setSelected(i); loadSailor(sailors[i]); }}
        selIdx={selected}/>
      </div>

      {/* ── Live Webcam Stream Modal ── */}
      {showWebcamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-[#143322] border-2 border-green-500/60 rounded-2xl p-5 w-[480px] shadow-2xl flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-3 pb-2 border-b border-white/20">
              <h3 className="text-white font-bold text-base flex items-center gap-2">📷 Live Webcam Capture</h3>
              <button onClick={stopWebcam} className="text-white/60 hover:text-white text-xl font-bold">✕</button>
            </div>
            <div className="w-full h-64 bg-black rounded-xl overflow-hidden border border-white/20 relative flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3 w-full mt-4">
              <Btn variant="neutral" onClick={stopWebcam} className="flex-1">Cancel</Btn>
              <Btn variant="primary" onClick={capturePhoto} className="flex-1">📸 Take Snapshot</Btn>
            </div>
          </div>
        </div>
      )}
      {showSearch&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-[#143322] rounded-xl border-2 border-white/40 p-5 w-[600px] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white text-sm font-semibold">Search</span>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} autoFocus
                className="bg-white text-gray-900 text-sm px-2 py-1 rounded flex-1" placeholder="Name / Mobile / P.No"/>
              <Btn variant="danger" onClick={()=>setShowSearch(false)}>Close</Btn>
            </div>
            <Table cols={[{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"mobile",label:"Mobile"},{key:"rank",label:"Rank"},{key:"type",label:"Type"}]}
              rows={filteredSailors} onRowClick={i=>{setSelected(i);loadSailor(filteredSailors[i]);}} selIdx={selected}/>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stock Details ────────────────────────────────────────────────────────────
function StockDetails({ products, setProducts, stockData, setStockData, onNavigateTo }: any) {
  const [productCode,setProductCode]=useState(""); const [productName,setProductName]=useState("");
  const [vendorName,setVendorName]=useState("INCS"); const [purchaseQty,setPurchaseQty]=useState("");
  const [qtyType,setQtyType]=useState("BOTTLE"); const [purchasePrice,setPurchasePrice]=useState("");
  const [salePrice,setSalePrice]=useState(""); const [selected,setSelected]=useState<number|undefined>();

  function handleCodeChange(code:string){
    setProductCode(code);
    const prod=products.find((p:any)=>p.code===code);
    if(prod){setProductName(prod.name);setQtyType(prod.sub||"BOTTLE");setSalePrice(String(prod.price));}
  }
  async function handleCreate(){
    if(!productCode||!purchaseQty){ toast.error("Product Code and Qty are required!"); return; }
    const newStock={code:productCode,name:productName||"Unknown",vendor:vendorName,purchasePrice:Number(purchasePrice)||0,salePrice:Number(salePrice)||0,purchaseQty:Number(purchaseQty),unitType:qtyType,purchasedBy:"superadmin",purchaseDate:new Date().toLocaleDateString("en-GB")};
    try {
      await api.addStock(newStock);
    } catch(e:any) { console.warn("API fallback:", e); }
    setStockData((prev:any)=>[newStock,...prev]);
    setProducts((prev:any)=>prev.map((p:any)=>p.code===productCode?{...p,stock:p.stock+Number(purchaseQty),price:Number(salePrice)||p.price}:p));
    toast.success("Stock added!"); handleClear();
  }
  function handleUpdate(){
    if(selected===undefined) return;
    const old=stockData[selected]; const qtyDiff=Number(purchaseQty)-old.purchaseQty;
    setStockData((prev:any)=>prev.map((s:any,idx:number)=>idx===selected?{...s,vendor:vendorName,purchasePrice:Number(purchasePrice),salePrice:Number(salePrice),purchaseQty:Number(purchaseQty),unitType:qtyType}:s));
    setProducts((prev:any)=>prev.map((p:any)=>p.code===productCode?{...p,stock:Math.max(0,p.stock+qtyDiff),price:Number(salePrice)||p.price}:p));
    toast.success("Stock updated!"); handleClear();
  }
  function handleDelete(){
    if(selected===undefined) return;
    const old=stockData[selected];
    setProducts((prev:any)=>prev.map((p:any)=>p.code===old.code?{...p,stock:Math.max(0,p.stock-old.purchaseQty)}:p));
    setStockData((prev:any)=>prev.filter((_:any,idx:number)=>idx!==selected));
    toast.success("Stock record deleted!"); handleClear();
  }
  function handleClear(){setProductCode("");setProductName("");setVendorName("INCS");setPurchaseQty("");setPurchasePrice("");setSalePrice("");setQtyType("BOTTLE");setSelected(undefined);}
  function handleRowClick(i:number){setSelected(i);const r=stockData[i];setProductCode(r.code);setProductName(r.name);setVendorName(r.vendor);setPurchaseQty(String(r.purchaseQty));setPurchasePrice(String(r.purchasePrice));setSalePrice(String(r.salePrice));setQtyType(r.unitType);}

  return (
    <div>
      <SectionTitle icon={<Warehouse size={22}/>} title="Stock Details"/>
      <div className="bg-[#143322] rounded-lg p-4 mb-4 border border-white/30">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <FI label="Product Code" value={productCode} onChange={handleCodeChange} required/>
          <FI label="Product Name" value={productName} onChange={setProductName}/>
          <FI label="Vendor Name" value={vendorName} onChange={setVendorName}/>
          <FI label="Purchase Quantity" value={purchaseQty} onChange={setPurchaseQty} required/>
          <FS label="Quantity Type" value={qtyType} onChange={setQtyType} options={["BOTTLE","CASE","CARTON"]}/>
          <FI label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} required/>
          <FI label="Sale Price" value={salePrice} onChange={setSalePrice} required/>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          {selected!==undefined&&<Btn variant="primary" onClick={handleUpdate}>Update</Btn>}
          {selected!==undefined&&<Btn variant="danger" onClick={handleDelete}>Delete</Btn>}
          <Btn variant="neutral" onClick={handleClear}>Clear</Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
        </div>
      </div>
      <Table cols={[{key:"code",label:"Code"},{key:"name",label:"Product Name"},{key:"vendor",label:"Vendor"},{key:"purchasePrice",label:"Purchase Price"},{key:"salePrice",label:"Sale Price"},{key:"purchaseQty",label:"Purchase Qty"},{key:"unitType",label:"Unit Type"},{key:"purchasedBy",label:"Purchase By"},{key:"purchaseDate",label:"Date"}]}
        rows={stockData} onRowClick={handleRowClick} selIdx={selected}/>
    </div>
  );
}

// ─── Vendor ───────────────────────────────────────────────────────────────────
function VendorDetails({ vendors, setVendors, onNavigateTo }: any) {
  const [vId,setVId]=useState(""); const [vName,setVName]=useState(""); const [contact,setContact]=useState("");
  const [mobile,setMobile]=useState(""); const [address,setAddress]=useState(""); const [gst,setGst]=useState("");
  const [selected,setSelected]=useState<number|undefined>();

  async function handleCreate(){
    if(!vId||!vName){toast.error("Vendor ID and Name are required!");return;}
    if(vendors.some((v:any)=>v.id===vId)){toast.error("Vendor ID exists!");return;}
    const newVend = {id:vId,name:vName,contact,mobile,address,gst};
    try {
      await api.createVendor(newVend);
    } catch(e:any) { console.warn("API fallback:", e); }
    setVendors((prev:any)=>[...prev,newVend]);
    toast.success("Vendor created!"); handleClear();
  }
  async function handleUpdate(){
    if(selected===undefined) return;
    const targetId = vId || vendors[selected]?.id;
    if(!targetId) return;
    const updated = {id:targetId,name:vName,contact,mobile,address,gst};
    try {
      await api.updateVendor(targetId, updated);
    } catch(e:any) { console.warn("API fallback:", e); }
    setVendors((prev:any)=>prev.map((v:any,idx:number)=>idx===selected?updated:v));
    toast.success("Vendor updated!"); handleClear();
  }
  async function handleDelete(){
    if(selected===undefined) return;
    const targetId = vendors[selected]?.id;
    if(!targetId) return;
    try {
      await api.deleteVendor(targetId);
    } catch(e:any) { console.warn("API fallback:", e); }
    setVendors((prev:any)=>prev.filter((_:any,idx:number)=>idx!==selected));
    toast.success("Vendor deleted!"); handleClear();
  }
  function handleRowClick(i:number){setSelected(i);const r=vendors[i];setVId(r.id);setVName(r.name);setContact(r.contact);setMobile(r.mobile);setAddress(r.address);setGst(r.gst);}
  function handleClear(){setVId("");setVName("");setContact("");setMobile("");setAddress("");setGst("");setSelected(undefined);}

  return (
    <div>
      <SectionTitle icon={<Truck size={22}/>} title="Vendor Details"/>
      <div className="bg-[#143322] rounded-lg p-4 mb-4 border border-white/30">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <FI label="Vendor ID" value={vId} onChange={setVId}/>
          <FI label="Vendor Name" value={vName} onChange={setVName} required/>
          <FI label="Contact Person" value={contact} onChange={setContact}/>
          <FI label="Mobile No." value={mobile} onChange={setMobile}/>
          <FI label="Address" value={address} onChange={setAddress}/>
          <FI label="GST Number" value={gst} onChange={setGst}/>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          {selected!==undefined&&<Btn variant="primary" onClick={handleUpdate}>Update</Btn>}
          {selected!==undefined&&<Btn variant="danger" onClick={handleDelete}>Delete</Btn>}
          <Btn variant="neutral" onClick={handleClear}>Clear</Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
        </div>
      </div>
      <Table cols={[{key:"id",label:"Vendor ID"},{key:"name",label:"Vendor Name"},{key:"contact",label:"Contact"},{key:"mobile",label:"Mobile"},{key:"address",label:"Address"},{key:"gst",label:"GST No."}]}
        rows={vendors} onRowClick={handleRowClick} selIdx={selected}/>
    </div>
  );
}

// ─── Recharge / Refund ────────────────────────────────────────────────────────
function RechargeRefund({ sailors, setSailors, rechargeReport, setRechargeReport, refundReport, setRefundReport, onNavigateTo }: any) {
  const [tab,setTab]=useState<"recharge"|"refund">("recharge");
  const [rCustId,setRCustId]=useState(""); const [rAvAmt,setRAvAmt]=useState(""); const [rRechAmt,setRRechAmt]=useState(""); const [rPrint,setRPrint]=useState(false);
  const [refCustId,setRefCustId]=useState(""); const [refAvAmt,setRefAvAmt]=useState(""); const [refAmt,setRefAmt]=useState(""); const [refDeposit,setRefDeposit]=useState("50"); const [refPrint,setRefPrint]=useState(false); const [refIsActive,setRefIsActive]=useState(false);
  const [activeSailor,setActiveSailor]=useState<any|null>(null);

  function handleRechargeIdChange(id:string){setRCustId(id);const f=sailors.find((s:any)=>s.id===id||s.pNo===id);if(f){setActiveSailor(f);setRAvAmt(f.balance.toFixed(2));}else{setActiveSailor(null);setRAvAmt("");}}
  function handleRefundIdChange(id:string){setRefCustId(id);const f=sailors.find((s:any)=>s.id===id||s.pNo===id);if(f){setActiveSailor(f);setRefAvAmt(f.balance.toFixed(2));setRefDeposit(String(f.regRefund||50));}else{setActiveSailor(null);setRefAvAmt("");}}
  function appendDigit(d:string){if(tab==="recharge")setRRechAmt(p=>p+d);else setRefAmt(p=>p+d);}
  function backspace(){if(tab==="recharge")setRRechAmt(p=>p.slice(0,-1));else setRefAmt(p=>p.slice(0,-1));}

  async function handleRechargeSubmit(){
    if(!activeSailor){toast.error("Enter a valid Customer ID!");return;}
    const amt=Number(rRechAmt);if(isNaN(amt)||amt<=0){toast.error("Enter a valid amount!");return;}
    try {
      const res = await api.rechargeCard(activeSailor.id, amt);
      setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:res.newBalance,status:"Active"}:s));
      toast.success(res.message || `Recharged ₹${amt} successfully!`);
    } catch(e:any) {
      console.warn("API fallback:", e);
      setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:s.balance+amt,status:"Active"}:s));
      toast.success(`Recharged ₹${amt} successfully!`);
    }
    const txNo="RCH-TRN"+Math.floor(10000000+Math.random()*90000000);
    setRechargeReport((prev:any)=>[{sno:prev.length+1,transactionNo:txNo,customerId:activeSailor.id,name:activeSailor.name,pNo:activeSailor.pNo,category:activeSailor.type,rechAmount:amt},...prev]);
    setRCustId("");setRAvAmt("");setRRechAmt("");setActiveSailor(null);
  }
  async function handleRefundSubmit(){
    if(!activeSailor){toast.error("Enter a valid Customer ID!");return;}
    const balance=activeSailor.balance; const deposit=Number(refDeposit)||50;
    let refundAmt=0;
    if(refIsActive){refundAmt=balance+deposit;}
    else{refundAmt=Number(refAmt);if(isNaN(refundAmt)||refundAmt<=0){toast.error("Enter a valid refund amount!");return;}if(refundAmt>balance){toast.error("Refund exceeds balance!");return;}}
    try {
      const res = await api.refundCard(activeSailor.id, "Refund processed");
      setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:0,status:"Deactive"}:s));
      toast.success(res.message || `Card deactivated. Refunded ₹${refundAmt}`);
    } catch(e:any) {
      console.warn("API fallback:", e);
      setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:refIsActive?0:s.balance-refundAmt,status:refIsActive?"Deactive":s.status}:s));
      toast.success(refIsActive?`Card deactivated. Refunded ₹${refundAmt}`:`Refunded ₹${refundAmt}`);
    }
    const txNo="REF-TRN"+Math.floor(10000000+Math.random()*90000000);
    setRefundReport((prev:any)=>[{sno:prev.length+1,transactionNo:txNo,customerId:activeSailor.id,name:activeSailor.name,pNo:activeSailor.pNo,category:activeSailor.type,refundDeposit:refundAmt,date:new Date().toLocaleDateString("en-GB")},...prev]);
    setRefCustId("");setRefAvAmt("");setRefAmt("");setRefIsActive(false);setActiveSailor(null);
  }

  return (
    <div>
      <SectionTitle icon={<CreditCard size={22}/>} title="Recharge / Refund"/>
      <div className="bg-[#143322] rounded-lg border border-white/30 overflow-hidden">
        <div className="flex border-b border-white/20">
          {(["recharge","refund"] as const).map(t=>(
            <button key={t} onClick={()=>{setTab(t);setActiveSailor(null);}}
              className={`px-6 py-2 text-sm font-semibold transition-colors ${tab===t?"bg-white/20 text-white":"text-white/60 hover:text-white"}`}>
              {t==="recharge"?"Recharge Details":"Refund Details"}
            </button>
          ))}
        </div>
        <div className="p-5 flex gap-8">
          {tab==="recharge"?(
            <div className="flex-1 flex flex-col gap-3">
              <FI label="Customer ID" value={rCustId} onChange={handleRechargeIdChange} required/>
              {activeSailor&&<div className="text-xs text-green-300 font-bold">{activeSailor.name} ({activeSailor.rank})</div>}
              <FI label="Available Amount" value={rAvAmt} readOnly/>
              <FI label="Current Recharge Amount" value={rRechAmt} onChange={setRRechAmt} required/>
              <label className="flex items-center gap-2 text-white text-sm cursor-pointer">
                <input type="checkbox" checked={rPrint} onChange={e=>setRPrint(e.target.checked)} className="accent-green-500"/>Print Bill
              </label>
              <div className="flex gap-3 mt-2">
                <Btn variant="primary" onClick={handleRechargeSubmit}>Recharge</Btn>
                <Btn variant="neutral" onClick={()=>{setRCustId("");setRAvAmt("");setRRechAmt("");setRPrint(false);setActiveSailor(null);}}>Clear</Btn>
                <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          ):(
            <div className="flex-1 flex flex-col gap-3">
              <FI label="Customer ID" value={refCustId} onChange={handleRefundIdChange} required/>
              {activeSailor&&<div className="text-xs text-green-300 font-bold">{activeSailor.name} ({activeSailor.status})</div>}
              <FI label="Available Amount" value={refAvAmt} readOnly/>
              <FI label="Refund Amount" value={refAmt} onChange={setRefAmt} required={!refIsActive}/>
              <div className="flex items-center gap-3">
                <FI label="Refund Deposit" value={refDeposit} onChange={setRefDeposit} className="flex-1"/>
                <label className="flex items-center gap-1.5 text-white text-sm cursor-pointer mt-5">
                  <input type="checkbox" checked={refPrint} onChange={e=>setRefPrint(e.target.checked)} className="accent-green-500"/>Print Bill
                </label>
              </div>
              <label className="flex items-center gap-2 text-white text-xs cursor-pointer">
                <input type="checkbox" checked={refIsActive} onChange={e=>setRefIsActive(e.target.checked)} className="accent-green-500"/>
                Is Active <span className="text-white/50 ml-1">(Check to refund deposit and deactivate card)</span>
              </label>
              <div className="flex gap-3 mt-2">
                <Btn variant="primary" onClick={handleRefundSubmit}>Refund</Btn>
                <Btn variant="neutral" onClick={()=>{setRefCustId("");setRefAvAmt("");setRefAmt("");setRefDeposit("");setRefPrint(false);setRefIsActive(false);setActiveSailor(null);}}>Clear</Btn>
                <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}
          <div className="w-44">
            <div className="grid grid-cols-3 gap-1.5">
              {["1","2","3","4","5","6","7","8","9"].map(d=>(
                <button key={d} onClick={()=>appendDigit(d)}
                  className="bg-[#071a0d] border border-white/30 text-white font-bold text-lg py-3 rounded hover:bg-[#0f2d1a]">{d}</button>
              ))}
              <button onClick={backspace} className="bg-[#071a0d] border border-white/30 text-white font-bold text-sm py-3 rounded hover:bg-[#0f2d1a]">⌫</button>
              <button onClick={()=>appendDigit("0")} className="bg-[#071a0d] border border-white/30 text-white font-bold text-lg py-3 rounded hover:bg-[#0f2d1a] col-span-2">0</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Transactions Table filtered by active tab ── */}
      <div className="mt-5">
        <h3 className="text-white text-sm font-bold mb-2 flex items-center gap-2">
          <span>{tab === "recharge" ? "💳" : "💸"}</span>
          <span>Recent {tab === "recharge" ? "Recharge" : "Refund"} Transactions</span>
        </h3>
        <Table cols={[
          {key:"transactionNo",label:"Transaction No"},
          {key:"customerId",label:"Customer ID"},
          {key:"name",label:"Customer Name"},
          {key:"type",label:"Type"},
          {key:"amount",label:"Amount"},
          {key:"date",label:"Date"}
        ]}
        rows={tab === "recharge" ? (
          rechargeReport.map((r: any) => ({
            transactionNo: r.transactionNo || "RCH-TRN",
            customerId: r.customerId,
            name: r.name || "Sailor",
            type: <span className="bg-green-700 text-white font-bold px-2 py-0.5 rounded text-xs">RECHARGE</span>,
            amount: <span className="text-green-400 font-bold">+₹{Number(r.rechAmount || 0).toFixed(2)}</span>,
            date: r.date || new Date().toLocaleDateString("en-GB")
          }))
        ) : (
          refundReport.map((r: any) => ({
            transactionNo: r.transactionNo || "REF-TRN",
            customerId: r.customerId,
            name: r.name || "Sailor",
            type: <span className="bg-red-700 text-white font-bold px-2 py-0.5 rounded text-xs">REFUND</span>,
            amount: <span className="text-red-300 font-bold">-₹{Number(r.refundDeposit || 0).toFixed(2)}</span>,
            date: r.date || new Date().toLocaleDateString("en-GB")
          }))
        )} />
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
const REPORT_CONFIG: Record<string,{searchTypes:string[]}> = {
  "Sales Report":      {searchTypes:["POS Name","Customer ID","Card Category"]},
  "Stock Report":      {searchTypes:["Product","Category"]},
  "Card Report":       {searchTypes:["Card Recharge","Card Refund","Lost Card","Card Registration"]},
  "Visitor Report":    {searchTypes:["All"]},
  "Customer Report":   {searchTypes:["All"]},
  "Console Report":    {searchTypes:["Sales Report"]},
  "New Sales Report":  {searchTypes:["Product"]},
  "New Console Report":{searchTypes:["All"]},
};

function ReportsScreen({ products:_p, sailors, stockData, salesReport, consoleReport, newSalesReport, rechargeReport, refundReport, cardRegistration, lostCards, onNavigateTo }: any) {
  const [reportType,setReportType]=useState("Sales Report");
  const [searchType,setSearchType]=useState("POS Name");
  const [fromDate,setFromDate]=useState("13/07/2026");
  const [toDate,setToDate]=useState("13/07/2026");
  const [search,setSearch]=useState("");

  function handleReportTypeChange(v:string){setReportType(v);setSearchType(REPORT_CONFIG[v].searchTypes[0]);setSearch("");}

  let cols:{key:string;label:string}[]=[];
  let rows:Record<string,React.ReactNode>[]=[];
  let footerCells:{label:string;value:string}[]=[];

  if(reportType==="Sales Report"){
    cols=[{key:"sno",label:"S.No"},{key:"type",label:"Type"},{key:"billNo",label:"Bill Number"},{key:"customerId",label:"Customer ID"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Card Category"},{key:"item",label:"Item"}];
    rows=salesReport;
    footerCells=[{label:"Total Sale Qty",value:`${salesReport.length}.00`}];
  } else if(reportType==="Stock Report"){
    cols=[{key:"code",label:"Code"},{key:"name",label:"Product Name"},{key:"vendor",label:"Vendor"},{key:"purchaseQty",label:"Stock Qty"},{key:"purchasePrice",label:"Purchase Price"},{key:"salePrice",label:"Sale Price"},{key:"unitType",label:"Unit"}];
    rows=stockData;
    footerCells=[{label:"Total Stock Lines",value:String(stockData.length)}];
  } else if(reportType==="Card Report"){
    if(searchType==="Card Recharge"){
      cols=[{key:"sno",label:"S.No"},{key:"transactionNo",label:"Transaction No"},{key:"customerId",label:"Customer ID"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Category"},{key:"rechAmount",label:"Rech Amount"}];
      rows=rechargeReport.map((r:any)=>({...r,rechAmount:r.rechAmount.toFixed(2)}));
      footerCells=[{label:"Total Recharge",value:rechargeReport.reduce((s:number,r:any)=>s+r.rechAmount,0).toFixed(2)}];
    } else if(searchType==="Card Refund"){
      cols=[{key:"sno",label:"S.No"},{key:"transactionNo",label:"Transaction No"},{key:"customerId",label:"Customer ID"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Category"},{key:"refundDeposit",label:"Refund Amt"},{key:"date",label:"Date"}];
      rows=refundReport.map((r:any)=>({...r,refundDeposit:r.refundDeposit.toFixed(2)}));
      footerCells=[{label:"Total Refund",value:refundReport.reduce((s:number,r:any)=>s+r.refundDeposit,0).toFixed(2)}];
    } else if(searchType==="Lost Card"){
      cols=[{key:"sno",label:"S.No"},{key:"customerId",label:"Customer ID"},{key:"transactionNo",label:"Transaction No"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Category"},{key:"date",label:"Date"}];
      rows=lostCards;
      footerCells=[{label:"Total Lost Cards",value:String(lostCards.length)}];
    } else {
      cols=[{key:"sno",label:"S.No"},{key:"customerId",label:"Customer ID"},{key:"transactionNo",label:"Transaction No"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Category"},{key:"uniqueId",label:"Unique ID"},{key:"rank",label:"Rank"},{key:"deposit",label:"Deposit"}];
      rows=cardRegistration;
      const totDep=cardRegistration.reduce((s:number,r:any)=>s+r.deposit,0);
      footerCells=[{label:"Total Ref Dep",value:`${totDep}.00`},{label:"Total Reg",value:`${totDep}.00`}];
    }
  } else if(reportType==="Console Report"){
    cols=[{key:"sno",label:"S.No"},{key:"billNo",label:"Bill Number"},{key:"totalPrice",label:"Total Price"},{key:"userId",label:"User ID"},{key:"date",label:"Date"},{key:"posName",label:"POS Name"}];
    rows=consoleReport.map((r:any)=>({...r,totalPrice:r.totalPrice.toFixed(2)}));
    footerCells=[{label:"Total Amount",value:consoleReport.reduce((s:number,r:any)=>s+r.totalPrice,0).toFixed(2)}];
  } else if(reportType==="New Sales Report"){
    cols=[{key:"sno",label:"S.No"},{key:"productName",label:"Product Name"},{key:"shipName",label:"Ship Name"},{key:"saleQty",label:"Sale Qty"},{key:"subCategory",label:"Sub Category"},{key:"price",label:"Price"}];
    rows=newSalesReport.map((r:any)=>({...r,price:r.price.toFixed(2)}));
    footerCells=[{label:"Total Qty",value:`${newSalesReport.reduce((s:number,r:any)=>s+r.saleQty,0)}.00`},{label:"Grand Total",value:newSalesReport.reduce((s:number,r:any)=>s+(r.saleQty*r.price),0).toFixed(2)}];
  } else if(reportType==="New Console Report"){
    cols=[{key:"description",label:"Description"},{key:"amount",label:"Amount"}];
    const totalReg=cardRegistration.reduce((s:number,c:any)=>s+c.deposit,0);
    const totalRech=rechargeReport.reduce((s:number,r:any)=>s+r.rechAmount,0);
    const totalSales=consoleReport.reduce((s:number,r:any)=>s+r.totalPrice,0);
    const totalRefund=refundReport.reduce((s:number,r:any)=>s+r.refundDeposit,0);
    rows=[
      {description:"Total Registration Amount",amount:`${totalReg.toFixed(2)}`},
      {description:"Total Recharge Amount",amount:`${totalRech.toFixed(2)}`},
      {description:"Total Inflow Amount",amount:`${(totalReg+totalRech).toFixed(2)}`},
      {description:"Total Sale Amount",amount:`${totalSales.toFixed(2)}`},
      {description:"Total Refunded Amount",amount:`${totalRefund.toFixed(2)}`},
      {description:"Total Outflow Amount",amount:`${(totalSales+totalRefund).toFixed(2)}`},
      {description:"Total Balance Amount",amount:`${(totalReg+totalRech-(totalSales+totalRefund)).toFixed(2)}`},
    ];
  } else if(reportType==="Visitor Report"||reportType==="Customer Report"){
    cols=[{key:"sno",label:"S.No"},{key:"customerId",label:"Customer ID"},{key:"name",label:"Name"},{key:"pNo",label:"P.No"},{key:"category",label:"Category"},{key:"mobile",label:"Mobile"},{key:"unit",label:"Unit"}];
    rows=sailors.map((s:any,i:number)=>({sno:i+1,customerId:s.id,name:s.name,pNo:s.pNo,category:s.type,mobile:s.mobile,unit:s.unit}));
    footerCells=[{label:"Total Records",value:String(sailors.length)}];
  }

  const filtered=rows.filter(r=>Object.values(r).some(v=>String(v).toLowerCase().includes(search.toLowerCase())));

  function handlePrint(){const w=window.open();if(!w)return;w.document.write(`<html><head><title>Print Report</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#2d6a4f;color:white;}</style></head><body><h2>${reportType}</h2><table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join('')}</tr></thead><tbody>${filtered.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`);w.document.close();w.print();}
  function handleExport(){let csv=cols.map(c=>c.label).join(",")+"\n";filtered.forEach(r=>{csv+=cols.map(c=>`"${String(r[c.key]||'')}"`).join(",")+"\n";});const blob=new Blob([csv],{type:'text/csv'});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`${reportType.replace(" ","_")}.csv`;link.click();}

  return (
    <div>
      <SectionTitle icon={<BarChart2 size={22}/>} title="Reports"/>
      <div className="bg-[#143322] rounded-lg p-4 border border-white/30 mb-4">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-3">
          <FS label="Reports Type" value={reportType} onChange={handleReportTypeChange} options={Object.keys(REPORT_CONFIG)}/>
          <FS label="Search Type" value={searchType} onChange={setSearchType} options={REPORT_CONFIG[reportType].searchTypes}/>
          <FI label="From Date" value={fromDate} onChange={setFromDate}/>
          <FI label="To Date" value={toDate} onChange={setToDate}/>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">Search</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="bg-white text-gray-900 text-sm px-2 py-1 rounded w-56" placeholder="Filter results..."/>
        </div>
      </div>
      <Table cols={cols} rows={filtered}/>
      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          <Btn variant="primary" onClick={handleExport}><span className="flex items-center gap-1.5"><Download size={14}/>Export</span></Btn>
          <Btn variant="primary" onClick={handlePrint}><span className="flex items-center gap-1.5"><Printer size={14}/>Print</span></Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
        </div>
        <div className="flex gap-6 flex-wrap">
          {footerCells.map(fc=>(
            <span key={fc.label} className="text-white font-semibold text-sm">{fc.label} : {fc.value}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement({ users, setUsers, onNavigateTo }: any) {
  const [selected,setSelected]=useState<number|undefined>();
  const [un,setUn]=useState(""); const [role,setRole]=useState(""); const [email,setEmail]=useState("");

  async function handleCreate(){
    if(!un||!role){toast.error("Username and Role required!");return;}
    if(users.some((u:any)=>u.username===un)){toast.error("Username exists!");return;}
    const newUser = {id:"U-"+String(users.length+1).padStart(3,'0'),username:un,role,email,status:"Active",lastLogin:"—"};
    try {
      await api.createUser(newUser);
    } catch(e:any) { console.warn("API fallback:", e); }
    setUsers((prev:any)=>[...prev,newUser]);
    toast.success("User created!");handleClear();
  }
  function handleUpdate(){if(selected===undefined)return;const t=users[selected];setUsers((prev:any)=>prev.map((u:any)=>u.id===t.id?{...u,role,email}:u));toast.success("User updated!");handleClear();}
  function handleDelete(){if(selected===undefined)return;const t=users[selected];setUsers((prev:any)=>prev.filter((u:any)=>u.id!==t.id));toast.success("User removed!");handleClear();}
  function handleClear(){setUn("");setRole("");setEmail("");setSelected(undefined);}

  return (
    <div>
      <SectionTitle icon={<UserCog size={22}/>} title="User Management"/>
      <div className="bg-[#143322] rounded-lg p-4 mb-4 border border-white/30">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <FI label="Username" value={un} onChange={setUn} required/>
          <FS label="Role" value={role} onChange={setRole} options={["Super Admin","Bar Admin","POS User","Stock Manager","Report Viewer"]} required/>
          <FI label="Email" value={email} onChange={setEmail}/>
          <FI label="Password" value="" type="password"/>
        </div>
        <div className="flex gap-3 mt-4">
          <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          {selected!==undefined&&<Btn variant="primary" onClick={handleUpdate}>Update</Btn>}
          {selected!==undefined&&<Btn variant="danger" onClick={handleDelete}>Delete</Btn>}
          <Btn variant="neutral" onClick={handleClear}>Clear</Btn>
          <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
        </div>
      </div>
      <Table cols={[{key:"id",label:"ID"},{key:"username",label:"Username"},{key:"role",label:"Role"},{key:"email",label:"Email"},{key:"status",label:"Status"},{key:"lastLogin",label:"Last Login"}]}
        rows={users} onRowClick={i=>{setSelected(i);const r=users[i];setUn(r.username);setRole(r.role);setEmail(r.email);}} selIdx={selected}/>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsScreen({ settings, setSettings, onNavigateTo }: any) {
  const fc=(field:string,val:any)=>setSettings((prev:any)=>({...prev,[field]:val}));
  const handleSave=async()=>{
    localStorage.setItem("arc_settings",JSON.stringify(settings));
    try {
      await api.updateSettings(settings);
    } catch(e:any) { console.warn("API fallback:", e); }
    toast.success("Settings saved!");
  };
  const handleReset=()=>{setSettings(INITIAL_SETTINGS);toast.success("Settings reset!");};

  return (
    <div>
      <SectionTitle icon={<Settings size={22}/>} title="Settings"/>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#143322] rounded-lg p-4 border border-white/30">
          <h3 className="text-green-300 font-bold text-sm mb-3">Organisation</h3>
          <div className="flex flex-col gap-2">
            <FI label="Organisation Name" value={settings.orgName} onChange={v=>fc("orgName",v)}/>
            <FI label="Short Name" value={settings.orgShortName} onChange={v=>fc("orgShortName",v)}/>
            <FI label="Address" value={settings.orgAddress} onChange={v=>fc("orgAddress",v)}/>
            <FI label="Phone" value={settings.orgPhone} onChange={v=>fc("orgPhone",v)}/>
            <FI label="Email" value={settings.orgEmail} onChange={v=>fc("orgEmail",v)}/>
          </div>
        </div>
        <div className="bg-[#143322] rounded-lg p-4 border border-white/30">
          <h3 className="text-green-300 font-bold text-sm mb-3">POS Configuration</h3>
          <div className="flex flex-col gap-2">
            <FI label="POS Name" value={settings.posName} onChange={v=>fc("posName",v)}/>
            <FI label="POS IP Address" value={settings.posIpAddress} onChange={v=>fc("posIpAddress",v)}/>
            <FI label="Receipt Header" value={settings.receiptHeader} onChange={v=>fc("receiptHeader",v)}/>
            <FI label="Receipt Footer" value={settings.receiptFooter} onChange={v=>fc("receiptFooter",v)}/>
            <FI label="Tax Rate (%)" value={String(settings.taxRate)} onChange={v=>fc("taxRate",Number(v)||0)}/>
          </div>
        </div>
        <div className="bg-[#143322] rounded-lg p-4 border border-white/30">
          <h3 className="text-green-300 font-bold text-sm mb-3">Card Settings</h3>
          <div className="flex flex-col gap-2">
            <FI label="Registration Deposit (₹)" value={String(settings.regDeposit)} onChange={v=>fc("regDeposit",Number(v)||0)}/>
            <FI label="Min Recharge Amount (₹)" value={String(settings.minRecharge)} onChange={v=>fc("minRecharge",Number(v)||0)}/>
            <FI label="Max Balance Limit (₹)" value={String(settings.maxBalance)} onChange={v=>fc("maxBalance",Number(v)||0)}/>
            <FI label="Card Validity (days)" value={String(settings.cardValidity)} onChange={v=>fc("cardValidity",Number(v)||0)}/>
            <FI label="Low Balance Alert (₹)" value={String(settings.lowBalanceAlert)} onChange={v=>fc("lowBalanceAlert",Number(v)||0)}/>
          </div>
        </div>
        <div className="bg-[#143322] rounded-lg p-4 border border-white/30">
          <h3 className="text-green-300 font-bold text-sm mb-3">Printer Settings</h3>
          <div className="flex flex-col gap-2">
            <FI label="Printer Name" value={settings.printerName} onChange={v=>fc("printerName",v)}/>
            <FI label="Paper Size" value={settings.paperSize} onChange={v=>fc("paperSize",v)}/>
            <FI label="Print Mode" value={settings.printMode} onChange={v=>fc("printMode",v)}/>
            <FI label="Receipt Copies" value={String(settings.receiptCopies)} onChange={v=>fc("receiptCopies",Number(v)||1)}/>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <Btn variant="primary" onClick={handleSave}>Save Settings</Btn>
        <Btn variant="neutral" onClick={handleReset}>Reset Defaults</Btn>
        <Btn variant="danger" onClick={()=>onNavigateTo("pos")}>Close</Btn>
      </div>
    </div>
  );
}

// ─── Master Management Center ──────────────────────────────────────────────────
function MasterScreen({
  categories, setCategories,
  brands, setBrands,
  ships, setShips,
  ranks, setRanks,
  onNavigateTo
}: any) {
  const [tab, setTab] = useState<"category" | "subcategory" | "brand" | "ship" | "rank">("category");

  // 1. Category state
  const [catName, setCatName] = useState("");
  const [catCode, setCatCode] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | undefined>();

  // 2. SubCategory state
  const [parentCatId, setParentCatId] = useState<number>(categories[0]?.id || 1);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");
  const [selectedSub, setSelectedSub] = useState<number | undefined>();

  // 3. Brand state
  const [brandName, setBrandName] = useState("");
  const [brandCategory, setBrandCategory] = useState(categories[0]?.name || "LIQUOR");
  const [brandDesc, setBrandDesc] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<number | undefined>();

  // 4. Ship/Unit state
  const [shipName, setShipName] = useState("");
  const [shipCommand, setShipCommand] = useState("Eastern Fleet");
  const [shipStatus, setShipStatus] = useState("Active");
  const [selectedShip, setSelectedShip] = useState<number | undefined>();

  // 5. Rank state
  const [rankName, setRankName] = useState("");
  const [rankCategory, setRankCategory] = useState("SAILOR");
  const [selectedRank, setSelectedRank] = useState<number | undefined>();

  // Category Handlers
  async function handleCreateCategory() {
    if (!catName.trim()) { toast.error("Category Name required!"); return; }
    const code = catCode || `CAT-${Math.floor(10 + Math.random() * 90)}`;
    const newCat = { code, name: catName.trim().toUpperCase(), description: catDesc, subCategories: [] };
    try {
      const res = await api.createCategory(newCat);
      setCategories((prev: any) => [...prev, res]);
      toast.success(`Category '${res.name}' created!`);
    } catch(e:any) {
      setCategories((prev: any) => [...prev, { ...newCat, id: Date.now() }]);
      toast.success(`Category '${newCat.name}' created!`);
    }
    setCatName(""); setCatCode(""); setCatDesc(""); setSelectedCat(undefined);
  }

  async function handleUpdateCategory() {
    if (selectedCat === undefined) return;
    const target = categories[selectedCat];
    if (!target) return;
    const updated = { ...target, name: catName.trim().toUpperCase(), code: catCode, description: catDesc };
    try { await api.updateCategory(target.id, updated); } catch(e:any){}
    setCategories((prev: any) => prev.map((c: any) => c.id === target.id ? updated : c));
    toast.success("Category updated!"); setCatName(""); setCatCode(""); setCatDesc(""); setSelectedCat(undefined);
  }

  async function handleDeleteCategory() {
    if (selectedCat === undefined) return;
    const target = categories[selectedCat];
    if (!target) return;
    try { await api.deleteCategory(target.id); } catch(e:any){}
    setCategories((prev: any) => prev.filter((c: any) => c.id !== target.id));
    toast.success("Category deleted!"); setCatName(""); setCatCode(""); setCatDesc(""); setSelectedCat(undefined);
  }

  // SubCategory Handlers
  async function handleCreateSubCategory() {
    if (!subName.trim()) { toast.error("SubCategory Name required!"); return; }
    const parentCat = categories.find((c: any) => c.id === parentCatId) || categories[0];
    if (!parentCat) { toast.error("Select a parent Category!"); return; }
    const newSub = { categoryId: parentCat.id, categoryName: parentCat.name, name: subName.trim().toUpperCase(), description: subDesc };
    try {
      const res = await api.createSubCategory(newSub);
      setCategories((prev: any) => prev.map((c: any) => c.id === parentCat.id ? { ...c, subCategories: [...(c.subCategories || []), res] } : c));
      toast.success(`SubCategory '${res.name}' created!`);
    } catch(e:any) {
      setCategories((prev: any) => prev.map((c: any) => c.id === parentCat.id ? { ...c, subCategories: [...(c.subCategories || []), { ...newSub, id: Date.now() }] } : c));
      toast.success(`SubCategory '${newSub.name}' created!`);
    }
    setSubName(""); setSubDesc(""); setSelectedSub(undefined);
  }

  async function handleUpdateSubCategory() {
    if (selectedSub === undefined) return;
    const allSubs = categories.flatMap((c: any) => c.subCategories || []);
    const target = allSubs[selectedSub];
    if (!target) return;
    const parentCat = categories.find((c: any) => c.id === parentCatId) || categories[0];
    const updated = { ...target, name: subName.trim().toUpperCase(), description: subDesc, categoryId: parentCat.id, categoryName: parentCat.name };
    try { await api.updateSubCategory(target.id, updated); } catch(e:any){}
    setCategories((prev: any) => prev.map((c: any) => ({
      ...c,
      subCategories: (c.subCategories || []).map((s: any) => s.id === target.id ? updated : s)
    })));
    toast.success("SubCategory updated!"); setSubName(""); setSubDesc(""); setSelectedSub(undefined);
  }

  async function handleDeleteSubCategory() {
    if (selectedSub === undefined) return;
    const allSubs = categories.flatMap((c: any) => c.subCategories || []);
    const target = allSubs[selectedSub];
    if (!target) return;
    try { await api.deleteSubCategory(target.id); } catch(e:any){}
    setCategories((prev: any) => prev.map((c: any) => ({
      ...c,
      subCategories: (c.subCategories || []).filter((s: any) => s.id !== target.id)
    })));
    toast.success("SubCategory deleted!"); setSubName(""); setSubDesc(""); setSelectedSub(undefined);
  }

  // Brand Handlers
  async function handleCreateBrand() {
    if (!brandName.trim()) { toast.error("Brand Name required!"); return; }
    const newBrand = { name: brandName.trim().toUpperCase(), categoryName: brandCategory, description: brandDesc };
    try {
      const res = await api.createBrand(newBrand);
      setBrands((prev: any) => [...prev, res]);
      toast.success(`Brand '${res.name}' created!`);
    } catch(e:any) {
      setBrands((prev: any) => [...prev, { ...newBrand, id: Date.now() }]);
      toast.success(`Brand '${newBrand.name}' created!`);
    }
    setBrandName(""); setBrandDesc(""); setSelectedBrand(undefined);
  }

  async function handleUpdateBrand() {
    if (selectedBrand === undefined) return;
    const target = brands[selectedBrand];
    if (!target) return;
    const updated = { ...target, name: brandName.trim().toUpperCase(), categoryName: brandCategory, description: brandDesc };
    try { await api.updateBrand(target.id, updated); } catch(e:any){}
    setBrands((prev: any) => prev.map((b: any) => b.id === target.id ? updated : b));
    toast.success("Brand updated!"); setBrandName(""); setBrandDesc(""); setSelectedBrand(undefined);
  }

  async function handleDeleteBrand() {
    if (selectedBrand === undefined) return;
    const target = brands[selectedBrand];
    if (!target) return;
    try { await api.deleteBrand(target.id); } catch(e:any){}
    setBrands((prev: any) => prev.filter((b: any) => b.id !== target.id));
    toast.success("Brand deleted!"); setBrandName(""); setBrandDesc(""); setSelectedBrand(undefined);
  }

  // Ship Handlers
  async function handleCreateShip() {
    if (!shipName.trim()) { toast.error("Ship/Unit Name required!"); return; }
    const newShip = { name: shipName.trim().toUpperCase(), command: shipCommand, status: shipStatus };
    try {
      const res = await api.createShip(newShip);
      setShips((prev: any) => [...prev, res]);
      toast.success(`Ship/Unit '${res.name}' created!`);
    } catch(e:any) {
      setShips((prev: any) => [...prev, { ...newShip, id: Date.now() }]);
      toast.success(`Ship/Unit '${newShip.name}' created!`);
    }
    setShipName(""); setSelectedShip(undefined);
  }

  async function handleUpdateShip() {
    if (selectedShip === undefined) return;
    const target = ships[selectedShip];
    if (!target) return;
    const updated = { ...target, name: shipName.trim().toUpperCase(), command: shipCommand, status: shipStatus };
    try { await api.updateShip(target.id, updated); } catch(e:any){}
    setShips((prev: any) => prev.map((s: any) => s.id === target.id ? updated : s));
    toast.success("Ship/Unit updated!"); setShipName(""); setSelectedShip(undefined);
  }

  async function handleDeleteShip() {
    if (selectedShip === undefined) return;
    const target = ships[selectedShip];
    if (!target) return;
    try { await api.deleteShip(target.id); } catch(e:any){}
    setShips((prev: any) => prev.filter((s: any) => s.id !== target.id));
    toast.success("Ship/Unit deleted!"); setShipName(""); setSelectedShip(undefined);
  }

  // Rank Handlers
  async function handleCreateRank() {
    if (!rankName.trim()) { toast.error("Rank Name required!"); return; }
    const newRank = { name: rankName.trim().toUpperCase(), category: rankCategory };
    try {
      const res = await api.createRank(newRank);
      setRanks((prev: any) => [...prev, res]);
      toast.success(`Rank '${res.name}' created!`);
    } catch(e:any) {
      setRanks((prev: any) => [...prev, { ...newRank, id: Date.now() }]);
      toast.success(`Rank '${newRank.name}' created!`);
    }
    setRankName(""); setSelectedRank(undefined);
  }

  async function handleUpdateRank() {
    if (selectedRank === undefined) return;
    const target = ranks[selectedRank];
    if (!target) return;
    const updated = { ...target, name: rankName.trim().toUpperCase(), category: rankCategory };
    try { await api.updateRank(target.id, updated); } catch(e:any){}
    setRanks((prev: any) => prev.map((r: any) => r.id === target.id ? updated : r));
    toast.success("Rank updated!"); setRankName(""); setSelectedRank(undefined);
  }

  async function handleDeleteRank() {
    if (selectedRank === undefined) return;
    const target = ranks[selectedRank];
    if (!target) return;
    try { await api.deleteRank(target.id); } catch(e:any){}
    setRanks((prev: any) => prev.filter((r: any) => r.id !== target.id));
    toast.success("Rank deleted!"); setRankName(""); setSelectedRank(undefined);
  }

  const allSubCategories = categories.flatMap((c: any) => (c.subCategories || []).map((s: any) => ({ ...s, parentCategoryName: c.name })));

  return (
    <div>
      <SectionTitle icon={<Layers size={22}/>} title="Master Management Center"/>
      <div className="bg-[#143322] rounded-lg border border-white/30 overflow-hidden mb-4">
        <div className="flex border-b border-white/20 flex-wrap">
          {(["category", "subcategory", "brand", "ship", "rank"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-semibold transition ${tab === t ? "bg-white/20 text-white border-b-2 border-green-400" : "text-white/60 hover:text-white"}`}>
              {t === "category" ? "📂 Category Master" :
               t === "subcategory" ? "🏷️ Sub-Category Master" :
               t === "brand" ? "🍾 Brand Master" :
               t === "ship" ? "🚢 Ship / Unit Master" : "🎖️ Rank Master"}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === "category" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FI label="Category Code" value={catCode} onChange={setCatCode} placeholder="Auto e.g. CAT-01"/>
                <FI label="Category Name" value={catName} onChange={setCatName} required placeholder="e.g. LIQUOR, FOOD"/>
                <FI label="Description" value={catDesc} onChange={setCatDesc}/>
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" onClick={handleCreateCategory}>Create Category</Btn>
                {selectedCat !== undefined && <Btn variant="primary" onClick={handleUpdateCategory}>Update</Btn>}
                {selectedCat !== undefined && <Btn variant="danger" onClick={handleDeleteCategory}>Delete</Btn>}
                <Btn variant="neutral" onClick={() => { setCatName(""); setCatCode(""); setCatDesc(""); setSelectedCat(undefined); }}>Clear</Btn>
                <Btn variant="danger" onClick={() => onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}

          {tab === "subcategory" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col gap-0.5">
                  <label className="text-white text-xs font-semibold">Parent Category <span className="text-red-300">*</span></label>
                  <select value={parentCatId} onChange={e => setParentCatId(Number(e.target.value))} className="bg-white text-gray-900 text-sm px-2 py-1 rounded">
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <FI label="Sub-Category Name" value={subName} onChange={setSubName} required placeholder="e.g. WHISKY, BEER"/>
                <FI label="Description" value={subDesc} onChange={setSubDesc}/>
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" onClick={handleCreateSubCategory}>Create Sub-Category</Btn>
                {selectedSub !== undefined && <Btn variant="primary" onClick={handleUpdateSubCategory}>Update</Btn>}
                {selectedSub !== undefined && <Btn variant="danger" onClick={handleDeleteSubCategory}>Delete</Btn>}
                <Btn variant="neutral" onClick={() => { setSubName(""); setSubDesc(""); setSelectedSub(undefined); }}>Clear</Btn>
                <Btn variant="danger" onClick={() => onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}

          {tab === "brand" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FI label="Brand Name" value={brandName} onChange={setBrandName} required placeholder="e.g. ROYAL STAG, PEPSI"/>
                <FS label="Category" value={brandCategory} onChange={setBrandCategory} options={categories.map((c: any) => c.name)}/>
                <FI label="Description / Manufacturer" value={brandDesc} onChange={setBrandDesc}/>
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" onClick={handleCreateBrand}>Create Brand</Btn>
                {selectedBrand !== undefined && <Btn variant="primary" onClick={handleUpdateBrand}>Update</Btn>}
                {selectedBrand !== undefined && <Btn variant="danger" onClick={handleDeleteBrand}>Delete</Btn>}
                <Btn variant="neutral" onClick={() => { setBrandName(""); setBrandDesc(""); setSelectedBrand(undefined); }}>Clear</Btn>
                <Btn variant="danger" onClick={() => onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}

          {tab === "ship" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FI label="Ship / Unit Name" value={shipName} onChange={setShipName} required placeholder="e.g. INS VIKRANT, INS DELHI"/>
                <FI label="Command / Fleet" value={shipCommand} onChange={setShipCommand}/>
                <FS label="Status" value={shipStatus} onChange={setShipStatus} options={["Active", "Deactive"]}/>
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" onClick={handleCreateShip}>Create Ship/Unit</Btn>
                {selectedShip !== undefined && <Btn variant="primary" onClick={handleUpdateShip}>Update</Btn>}
                {selectedShip !== undefined && <Btn variant="danger" onClick={handleDeleteShip}>Delete</Btn>}
                <Btn variant="neutral" onClick={() => { setShipName(""); setSelectedShip(undefined); }}>Clear</Btn>
                <Btn variant="danger" onClick={() => onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}

          {tab === "rank" && (
            <div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <FI label="Rank Title" value={rankName} onChange={setRankName} required placeholder="e.g. MCPO I, CPO, PO"/>
                <FS label="Rank Category" value={rankCategory} onChange={setRankCategory} options={["MASTER CHIEF PETTY OFFICER", "CHIEF PETTY OFFICER", "SENIOR SAILOR", "JUNIOR SAILOR"]}/>
              </div>
              <div className="flex gap-3">
                <Btn variant="primary" onClick={handleCreateRank}>Create Rank</Btn>
                {selectedRank !== undefined && <Btn variant="primary" onClick={handleUpdateRank}>Update</Btn>}
                {selectedRank !== undefined && <Btn variant="danger" onClick={handleDeleteRank}>Delete</Btn>}
                <Btn variant="neutral" onClick={() => { setRankName(""); setSelectedRank(undefined); }}>Clear</Btn>
                <Btn variant="danger" onClick={() => onNavigateTo("pos")}>Close</Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-white text-sm font-bold mb-2">
          {tab === "category" ? "Master Categories Directory" :
           tab === "subcategory" ? "Master Sub-Categories Directory" :
           tab === "brand" ? "Master Brands Directory" :
           tab === "ship" ? "Master Ships & Units Directory" : "Master Ranks Directory"}
        </h3>

        {tab === "category" && (
          <Table cols={[{ key: "id", label: "ID" }, { key: "code", label: "Category Code" }, { key: "name", label: "Category Name" }, { key: "description", label: "Description" }, { key: "subCount", label: "Sub-Categories Count" }]}
            rows={categories.map((c: any) => ({ ...c, subCount: <span className="bg-green-800 text-white font-bold px-2 py-0.5 rounded text-xs">{(c.subCategories || []).length} Sub-Categories</span> }))}
            onRowClick={i => { setSelectedCat(i); const r = categories[i]; if (r) { setCatCode(r.code); setCatName(r.name); setCatDesc(r.description || ""); } }}
            selIdx={selectedCat} />
        )}

        {tab === "subcategory" && (
          <Table cols={[{ key: "id", label: "ID" }, { key: "parentCategoryName", label: "Parent Category" }, { key: "name", label: "Sub-Category Name" }, { key: "description", label: "Description" }]}
            rows={allSubCategories.map((s: any) => ({ ...s, parentCategoryName: <span className="font-bold text-green-300">{s.parentCategoryName || s.categoryName}</span> }))}
            onRowClick={i => { setSelectedSub(i); const r = allSubCategories[i]; if (r) { setSubName(r.name); setSubDesc(r.description || ""); setParentCatId(r.categoryId); } }}
            selIdx={selectedSub} />
        )}

        {tab === "brand" && (
          <Table cols={[{ key: "id", label: "ID" }, { key: "name", label: "Brand Name" }, { key: "categoryName", label: "Category" }, { key: "description", label: "Description" }]}
            rows={brands}
            onRowClick={i => { setSelectedBrand(i); const r = brands[i]; if (r) { setBrandName(r.name); setBrandCategory(r.categoryName); setBrandDesc(r.description || ""); } }}
            selIdx={selectedBrand} />
        )}

        {tab === "ship" && (
          <Table cols={[{ key: "id", label: "ID" }, { key: "name", label: "Ship / Unit Name" }, { key: "command", label: "Command / Fleet" }, { key: "status", label: "Status" }]}
            rows={ships.map((s: any) => ({ ...s, status: <span className={`px-2 py-0.5 rounded text-xs font-bold ${s.status === "Active" ? "bg-green-700 text-white" : "bg-red-700 text-white"}`}>{s.status}</span> }))}
            onRowClick={i => { setSelectedShip(i); const r = ships[i]; if (r) { setShipName(r.name); setShipCommand(r.command); setShipStatus(r.status); } }}
            selIdx={selectedShip} />
        )}

        {tab === "rank" && (
          <Table cols={[{ key: "id", label: "ID" }, { key: "name", label: "Rank Title" }, { key: "category", label: "Rank Category" }]}
            rows={ranks}
            onRowClick={i => { setSelectedRank(i); const r = ranks[i]; if (r) { setRankName(r.name); setRankCategory(r.category); } }}
            selIdx={selectedRank} />
        )}
      </div>
    </div>
  );
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_ITEMS: {key:Screen;label:string;icon:React.ReactNode}[] = [
  {key:"pos",      label:"POS",      icon:<LayoutDashboard size={20}/>},
  {key:"products", label:"Product",  icon:<Package size={20}/>},
  {key:"master",   label:"Master",   icon:<Layers size={20}/>},
  {key:"sailor",   label:"Sailor",   icon:<Users size={20}/>},
  {key:"stock",    label:"Stock",    icon:<Warehouse size={20}/>},
  {key:"vendor",   label:"Vendor",   icon:<Truck size={20}/>},
  {key:"reports",  label:"Reports",  icon:<BarChart2 size={20}/>},
  {key:"user",     label:"User",     icon:<UserCog size={20}/>},
  {key:"card",     label:"Card",     icon:<CreditCard size={20}/>},
  {key:"settings", label:"Settings", icon:<Settings size={20}/>},
];

// ─── App root (auth shell) ───────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: "superadmin", role: "Super Admin" });

  if (!loggedIn) {
    return (
      <LoginPage
        onLogin={(username, role) => {
          setCurrentUser({ username, role });
          setLoggedIn(true);
        }}
      />
    );
  }

  return <AppShell currentUser={currentUser} onLogout={() => setLoggedIn(false)} />;
}

// ─── Main Application Shell ──────────────────────────────────────────────────
function AppShell({ currentUser, onLogout }: { currentUser: { username: string; role: string }; onLogout: () => void }) {
  const [screen,setScreen]=useState<Screen>("pos");
  const isPOS=screen==="pos";

  const [products,setProducts]=useState<any[]>(()=>ALL_PRODUCTS.map(p=>({...p,alertQty:10})));

  const [sailors,setSailors]=useState<any[]>(()=>SAILORS_DATA.map(s=>{
    const isLost=LOST_CARD_DATA.some(l=>l.customerId===s.id);
    const isRefunded=REFUND_REPORT_DATA.some(r=>r.customerId===s.id);
    const status=isLost?"Lost":isRefunded?"Deactive":"Active";
    const deposit=CARD_REGISTRATION_DATA.find(c=>c.customerId===s.id)?.deposit||50;
    const recharges=RECHARGE_REPORT_DATA.filter(r=>r.customerId===s.id).reduce((sum,r)=>sum+r.rechAmount,0);
    const refunds=REFUND_REPORT_DATA.filter(r=>r.customerId===s.id).reduce((sum,r)=>sum+r.refundDeposit,0);
    const customerBills=SALE_REPORT_DATA.filter(sr=>sr.customerId===s.id).map(sr=>sr.billNo);
    const sales=CONSOLE_REPORT_DATA.filter(c=>customerBills.includes(c.billNo.replace("SALE-",""))).reduce((sum,c)=>sum+c.totalPrice,0);
    const balance=status==="Deactive"?0:Math.max(0,deposit+recharges-sales-refunds);
    return{...s,balance,status};
  }));

  const [stockData,setStockData]=useState<any[]>(STOCK_DATA);
  const [salesReport,setSalesReport]=useState<any[]>(SALE_REPORT_DATA);
  const [consoleReport,setConsoleReport]=useState<any[]>(CONSOLE_REPORT_DATA);
  const [newSalesReport,setNewSalesReport]=useState<any[]>(NEW_SALES_REPORT_DATA);
  const [rechargeReport,setRechargeReport]=useState<any[]>(RECHARGE_REPORT_DATA);
  const [refundReport,setRefundReport]=useState<any[]>(REFUND_REPORT_DATA);
  const [cardRegistration,setCardRegistration]=useState<any[]>(CARD_REGISTRATION_DATA);
  const [lostCards]=useState<any[]>(LOST_CARD_DATA);
  const [vendors,setVendors]=useState<any[]>(VENDORS_DATA);
  const [users,setUsers]=useState<any[]>(INITIAL_USERS);
  const [settings,setSettings]=useState<any>(()=>{const saved=localStorage.getItem("arc_settings");return saved?JSON.parse(saved):INITIAL_SETTINGS;});
  const [categories, setCategories] = useState<any[]>([
    { id: 1, code: "CAT-01", name: "LIQUOR", description: "Alcoholic Beverages", subCategories: [
      { id: 1, categoryId: 1, categoryName: "LIQUOR", name: "WHISKY", description: "Blended & Single Malt" },
      { id: 2, categoryId: 1, categoryName: "LIQUOR", name: "BEER", description: "Lager & Draught" },
      { id: 3, categoryId: 1, categoryName: "LIQUOR", name: "RUM", description: "Dark & White Rum" },
      { id: 4, categoryId: 1, categoryName: "LIQUOR", name: "VODKA", description: "Flavored & Standard Vodka" },
      { id: 5, categoryId: 1, categoryName: "LIQUOR", name: "WINE", description: "Red & White Wine" },
    ]},
    { id: 2, code: "CAT-02", name: "FOOD", description: "Meals & Breads", subCategories: [
      { id: 6, categoryId: 2, categoryName: "FOOD", name: "BREAD/ROTI", description: "Naan & Roti" },
      { id: 7, categoryId: 2, categoryName: "FOOD", name: "VEGETARIAN", description: "Veg Curries" },
      { id: 8, categoryId: 2, categoryName: "FOOD", name: "NON VEGETARIAN", description: "Non-Veg Curries" },
    ]},
    { id: 3, code: "CAT-03", name: "SOFT DRINKS", description: "Cold Beverages", subCategories: [
      { id: 9, categoryId: 3, categoryName: "SOFT DRINKS", name: "COLD DRINK", description: "Soft drinks" }
    ]},
    { id: 4, code: "CAT-04", name: "PARTY FOOD", description: "Party Food", subCategories: [
      { id: 10, categoryId: 4, categoryName: "PARTY FOOD", name: "PARTY VEG", description: "Party Veg" },
      { id: 11, categoryId: 4, categoryName: "PARTY FOOD", name: "PARTY NONVEG", description: "Party Non-Veg" }
    ]}
  ]);

  const [brands, setBrands] = useState<any[]>([
    { id: 1, name: "ROYAL STAG", categoryName: "LIQUOR", description: "Royal Stag Whisky" },
    { id: 2, name: "OLD MONK", categoryName: "LIQUOR", description: "Old Monk Rum" },
    { id: 3, name: "CARLSBERG", categoryName: "LIQUOR", description: "Carlsberg Beer" },
    { id: 4, name: "PEPSI", categoryName: "SOFT DRINKS", description: "Pepsi Drink" }
  ]);
  const [ships, setShips] = useState<any[]>([
    { id: 1, name: "INS DELHI", command: "Eastern Fleet", status: "Active" },
    { id: 2, name: "INS VIKRANT", command: "Eastern Fleet", status: "Active" },
    { id: 3, name: "INS KOLKATA", command: "Eastern Fleet", status: "Active" }
  ]);
  const [ranks, setRanks] = useState<any[]>([
    { id: 1, name: "MCPO I", category: "MASTER CHIEF PETTY OFFICER" },
    { id: 2, name: "CPO", category: "CHIEF PETTY OFFICER" },
    { id: 3, name: "PO", category: "SENIOR SAILOR" },
    { id: 4, name: "SEA I", category: "JUNIOR SAILOR" }
  ]);

  // Fetch dynamic data from ASP.NET Core + PostgreSQL backend
  useEffect(() => {
    async function loadLiveData() {
      try {
        const [prods, sails, vends, sets, sales, consoleLogs, cats, brnds, shps, rnks] = await Promise.all([
          api.getProducts().catch(() => null),
          api.getSailors().catch(() => null),
          api.getVendors().catch(() => null),
          api.getSettings().catch(() => null),
          api.getSalesReport().catch(() => null),
          api.getConsoleReport().catch(() => null),
          api.getCategories().catch(() => null),
          api.getBrands().catch(() => null),
          api.getShips().catch(() => null),
          api.getRanks().catch(() => null),
        ]);
        if (prods) setProducts(prods);
        if (sails) setSailors(sails);
        if (vends) setVendors(vends);
        if (sets && Object.keys(sets).length > 0) setSettings((prev: any) => ({ ...prev, ...sets }));
        if (sales) setSalesReport(sales);
        if (consoleLogs) setConsoleReport(consoleLogs);
        if (cats && cats.length > 0) setCategories(cats);
        if (brnds && brnds.length > 0) setBrands(brnds);
        if (shps && shps.length > 0) setShips(shps);
        if (rnks && rnks.length > 0) setRanks(rnks);
      } catch (err) {
        console.warn("API Connection failed, using cached state.", err);
      }
    }
    loadLiveData();
  }, []);

  const screenMap:Record<Screen,React.ReactNode>={
    pos:<POSScreen products={products} setProducts={setProducts} sailors={sailors} setSailors={setSailors}
          salesReport={salesReport} setSalesReport={setSalesReport} consoleReport={consoleReport} setConsoleReport={setConsoleReport}
          newSalesReport={newSalesReport} setNewSalesReport={setNewSalesReport}/>,
    products:<ProductDetails products={products} setProducts={setProducts} categories={categories} brands={brands} onNavigateTo={setScreen}/>,
    master:<MasterScreen categories={categories} setCategories={setCategories} brands={brands} setBrands={setBrands} ships={ships} setShips={setShips} ranks={ranks} setRanks={setRanks} onNavigateTo={setScreen}/>,
    sailor:<SailorDetails sailors={sailors} setSailors={setSailors} cardRegistration={cardRegistration} setCardRegistration={setCardRegistration} onNavigateTo={setScreen}/>,
    stock:<StockDetails products={products} setProducts={setProducts} stockData={stockData} setStockData={setStockData} onNavigateTo={setScreen}/>,
    vendor:<VendorDetails vendors={vendors} setVendors={setVendors} onNavigateTo={setScreen}/>,
    reports:<ReportsScreen products={products} sailors={sailors} stockData={stockData} salesReport={salesReport} consoleReport={consoleReport} newSalesReport={newSalesReport} rechargeReport={rechargeReport} refundReport={refundReport} cardRegistration={cardRegistration} lostCards={lostCards} onNavigateTo={setScreen}/>,
    user:<UserManagement users={users} setUsers={setUsers} onNavigateTo={setScreen}/>,
    card:<RechargeRefund sailors={sailors} setSailors={setSailors} rechargeReport={rechargeReport} setRechargeReport={setRechargeReport} refundReport={refundReport} setRefundReport={setRefundReport} onNavigateTo={setScreen}/>,
    settings:<SettingsScreen settings={settings} setSettings={setSettings} onNavigateTo={setScreen}/>,
  };

  return (
    <div className="flex flex-col h-screen bg-background font-[Roboto,sans-serif] overflow-hidden">
      <Toaster position="top-right" richColors/>
      <header className="flex-shrink-0 bg-[#071a0d] border-b border-white/20">
        <div className="text-center py-1 bg-[#050f08] border-b border-white/10">
          <p className="text-white font-bold text-xs tracking-widest truncate">
            {settings.orgName.toUpperCase()} — {settings.orgShortName.toUpperCase()} — {settings.orgAddress.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center px-3">
          <div className="flex items-center flex-1">
            {NAV_ITEMS.map(item=>(
              <button key={item.key} onClick={()=>setScreen(item.key)}
                className={`flex flex-col items-center px-4 py-2 gap-0.5 transition-colors border-b-2 ${
                  screen===item.key?"border-green-400 text-white bg-white/10":"border-transparent text-white/70 hover:text-white hover:bg-white/5"
                }`}>
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-1">
                <span className="text-white/60 text-[10px]">User Name</span>
                <span className="bg-[#3a8c2f] text-white text-[10px] font-bold px-2 py-0.5 rounded">{currentUser.username}</span>
                <button onClick={()=>window.location.reload()} className="bg-[#2d6a4f] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90">
                  <RefreshCw size={10}/>Refresh
                </button>
                <button onClick={()=>onLogout()} className="bg-[#cc2222] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90">
                  <LogOut size={10}/>Logout
                </button>
              </div>
              <button onClick={()=>toast.success("Change password modal.")} className="bg-[#555] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90 self-end">
                <KeyRound size={10}/>Change Password
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className={`flex-1 min-h-0 flex flex-col ${isPOS?"overflow-hidden":"overflow-y-auto"}`}>
        {isPOS?screenMap[screen]:<div className="w-full max-w-screen-2xl mx-auto p-5">{screenMap[screen]}</div>}
      </main>
    </div>
  );
}
