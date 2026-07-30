import { useState, useRef } from "react";
import {
  Package, Users, Warehouse, Truck, BarChart2, UserCog, CreditCard,
  Settings, ChevronLeft, ChevronRight, RefreshCw, LogOut, KeyRound,
  Download, Printer, LayoutDashboard,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import {
  TILE_COLORS, ALL_PRODUCTS, SAILORS_DATA, STOCK_DATA,
  SALE_REPORT_DATA, CONSOLE_REPORT_DATA, NEW_SALES_REPORT_DATA,
  RECHARGE_REPORT_DATA, REFUND_REPORT_DATA, CARD_REGISTRATION_DATA,
  LOST_CARD_DATA, VENDORS_DATA, INITIAL_USERS, INITIAL_SETTINGS, SAILOR_TYPES
} from "./mockData";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "pos"|"products"|"sailor"|"stock"|"vendor"|"reports"|"user"|"card"|"settings";
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

function FI({ label, value, onChange, type="text", readOnly=false, required=false, className="" }: {
  label:string; value:string; onChange?:(v:string)=>void; type?:string; readOnly?:boolean; required?:boolean; className?:string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${className}`}>
      <label className="text-white text-xs font-semibold">{label}{required&&<span className="text-red-300 ml-0.5">*</span>}</label>
      <input type={type} value={value} readOnly={readOnly} onChange={e=>onChange?.(e.target.value)}
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
  function confirmPayment() {
    // Use ref so this always has the latest value, even when called from Enter-key handler
    const sailor = popupSailorRef.current;
    if(!sailor){ setPopupError("Card not found. Try Sailor ID, P.No or Mobile."); return; }
    if(sailor.status==="Deactive"){ setPopupError("Card is DEACTIVATED. Transaction blocked."); return; }
    if(sailor.status==="Lost"){ setPopupError("Card is reported LOST. Transaction blocked."); return; }
    if(grandTotal>sailor.balance){
      setPopupError(`Insufficient balance! Need ₹${grandTotal.toFixed(2)}, Available ₹${sailor.balance.toFixed(2)}`);
      return;
    }

    // Deduct stock
    setProducts(prev=>prev.map(p=>{
      const o=orderItems.find(x=>x.code===p.code);
      return o?{...p,stock:Math.max(0,p.stock-o.qty)}:p;
    }));

    // Deduct balance
    setSailors(prev=>prev.map(s=>
      s.id===sailor.id?{...s,balance:Math.max(0,s.balance-grandTotal)}:s
    ));

    const billNo="TRN"+Math.floor(1000000000+Math.random()*9000000000);

    setSalesReport(prev=>[
      ...orderItems.map((item,idx)=>({
        sno:prev.length+idx+1,type:"SALE",billNo,
        customerId:sailor.id,name:sailor.name,
        pNo:sailor.pNo,category:sailor.type,item:item.name
      })), ...prev
    ]);

    setConsoleReport(prev=>[{
      sno:prev.length+1,billNo:`SALE-${billNo}`,totalPrice:grandTotal,userId:"superadmin",
      date:`${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString()}`,posName:"POS-1"
    },...prev]);

    setNewSalesReport(prev=>{
      const copy=[...prev];
      orderItems.forEach(item=>{
        const found=copy.find(x=>x.productName===item.name);
        if(found) found.saleQty+=item.qty;
        else copy.push({sno:copy.length+1,productName:item.name,shipName:selectShip,saleQty:item.qty,subCategory:item.qtyType,price:item.price});
      });
      return copy;
    });

    // Show receipt popup instead of toast
    const orderNo = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const receiptDate = `${new Date().toLocaleDateString("en-GB")} ${new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`;
    setReceipt({ billNo, orderNo, sailor, items:[...orderItems], total:grandTotal, date:receiptDate });
    setShowCheckout(false);
    popupSailorRef.current = null;
    clearOrder();
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
function ProductDetails({ products, setProducts, onNavigateTo }: { products:any[]; setProducts:any; onNavigateTo:(s:Screen)=>void }) {
  const [code,setCode]=useState(""); const [name,setName]=useState("");
  const [category,setCategory]=useState("LIQUOR"); const [subCategory,setSubCategory]=useState("WHISKY");
  const [brand,setBrand]=useState("WHISKY"); const [alertQty,setAlertQty]=useState("10");
  const [search,setSearch]=useState(""); const [selected,setSelected]=useState<number|undefined>();

  const filtered=products.filter((r:any)=>
    r.code.toLowerCase().includes(search.toLowerCase())||
    r.name.toLowerCase().includes(search.toLowerCase())||
    r.category.toLowerCase().includes(search.toLowerCase()));

  function handleCreate(){
    if(!code||!name){ toast.error("Code and Name are required!"); return; }
    if(products.some((p:any)=>p.code===code)){ toast.error("Product Code already exists!"); return; }
    setProducts((prev:any)=>[{code,name,category,sub:subCategory,price:0,stock:0,alertQty:Number(alertQty)||10},...prev]);
    toast.success(`Product ${name} created!`); handleClear();
  }
  function handleUpdate(){
    if(selected===undefined) return;
    const orig=filtered[selected];
    setProducts((prev:any)=>prev.map((p:any)=>p.code===orig.code?{...p,code,name,category,sub:subCategory,alertQty:Number(alertQty)||10}:p));
    toast.success("Product updated!"); handleClear();
  }
  function handleDelete(){
    if(selected===undefined) return;
    const orig=filtered[selected];
    setProducts((prev:any)=>prev.filter((p:any)=>p.code!==orig.code));
    toast.success("Product deleted!"); handleClear();
  }
  function handleClear(){setCode("");setName("");setCategory("LIQUOR");setSubCategory("WHISKY");setBrand("WHISKY");setAlertQty("10");setSelected(undefined);}
  function handleRowClick(i:number){setSelected(i);const r=filtered[i];setCode(r.code);setName(r.name);setCategory(r.category);setSubCategory(r.sub);setBrand(r.sub);setAlertQty(String(r.alertQty||10));}

  return (
    <div>
      <SectionTitle icon={<Package size={22}/>} title="Product Details"/>
      <div className="bg-[#143322] rounded-lg p-4 mb-4 border border-white/30">
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <FI label="Code" value={code} onChange={setCode} required/>
          <FI label="Name" value={name} onChange={setName} required/>
          <FS label="Category" value={category} onChange={setCategory} options={["LIQUOR","FOOD","SOFT DRINKS","PARTY","PARTY FOOD"]} required/>
          <FS label="Sub Category" value={subCategory} onChange={setSubCategory} options={["WHISKY","RUM","BRANDY","VODKA","BEER","COLD DRINK","VEGETARIAN","NON VEGETARIAN","PARTY VEG","PARTY NONVEG","BREAD/ROTI"]} required/>
          <FS label="Brand" value={brand} onChange={setBrand} options={["WHISKY","RUM","BRANDY","VODKA","BEER","CANTEEN","SOFT DRINKS","KITCHEN"]}/>
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
  function handleCreate(){
    if(!sailorPNo||!sailorName||!mobileNo){ toast.error("P.No, Name, and Mobile are required!"); return; }
    if(sailors.some((s:any)=>s.pNo===sailorPNo)){ toast.error("Sailor with this P.No already exists!"); return; }
    const newId=sailorId||"000"+Math.floor(1000000+Math.random()*9000000);
    const newSailor={id:newId,name:sailorName,mobile:mobileNo,pNo:sailorPNo,rank,unit,type:sailorType,address,dob,regRefund:Number(regRefund)||50,balance:Number(regRefund)||50,status:"Active"};
    setSailors((prev:any)=>[newSailor,...prev]);
    const regTx="REG-TRN"+Math.floor(10000000+Math.random()*90000000);
    setCardRegistration((prev:any)=>[{sno:prev.length+1,customerId:newId,transactionNo:regTx,name:sailorName,pNo:sailorPNo,category:sailorType,uniqueId:`MCPO-${Math.floor(100+Math.random()*900)}`,rank,deposit:Number(regRefund)||50},...prev]);
    toast.success("Sailor registered!"); handleClear();
  }
  function handleUpdate(){
    if(selected===undefined&&!sailorId) return;
    setSailors((prev:any)=>prev.map((s:any)=>{
      if(s.id===sailorId||(selected!==undefined&&prev[selected].id===s.id))
        return{...s,name:sailorName,mobile:mobileNo,pNo:sailorPNo,rank,unit,type:sailorType,address,dob,regRefund:Number(regRefund)||50};
      return s;
    }));
    toast.success("Sailor updated!"); handleClear();
  }
  function handleDelete(){
    if(selected===undefined&&!sailorId) return;
    setSailors((prev:any)=>prev.filter((s:any,idx:number)=>!(idx===selected||s.id===sailorId)));
    toast.success("Sailor deleted!"); handleClear();
  }
  function startWebcam(){
    setIsCapturing(true);
    setTimeout(()=>{setPhotoUrl(`https://api.dicebear.com/7.x/adventurer/svg?seed=${sailorName||"navy"}`);setIsCapturing(false);toast.success("Photo captured!");},1500);
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
            <button onClick={startWebcam} className="bg-[#3a8c2f] text-white text-xs px-4 py-1.5 rounded w-full">📷 Capture</button>
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
  function handleCreate(){
    if(!productCode||!purchaseQty){ toast.error("Product Code and Qty are required!"); return; }
    const newStock={code:productCode,name:productName||"Unknown",vendor:vendorName,purchasePrice:Number(purchasePrice)||0,salePrice:Number(salePrice)||0,purchaseQty:Number(purchaseQty),unitType:qtyType,purchasedBy:"superadmin",purchaseDate:new Date().toLocaleDateString("en-GB")};
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

  function handleCreate(){ if(!vId||!vName){toast.error("Vendor ID and Name are required!");return;} if(vendors.some((v:any)=>v.id===vId)){toast.error("Vendor ID exists!");return;} setVendors((prev:any)=>[...prev,{id:vId,name:vName,contact,mobile,address,gst}]); toast.success("Vendor created!"); handleClear(); }
  function handleUpdate(){ if(selected===undefined) return; setVendors((prev:any)=>prev.map((v:any,idx:number)=>idx===selected?{...v,name:vName,contact,mobile,address,gst}:v)); toast.success("Vendor updated!"); handleClear(); }
  function handleDelete(){ if(selected===undefined) return; setVendors((prev:any)=>prev.filter((_:any,idx:number)=>idx!==selected)); toast.success("Vendor deleted!"); handleClear(); }
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

  function handleRechargeSubmit(){
    if(!activeSailor){toast.error("Enter a valid Customer ID!");return;}
    const amt=Number(rRechAmt);if(isNaN(amt)||amt<=0){toast.error("Enter a valid amount!");return;}
    setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:s.balance+amt,status:"Active"}:s));
    const txNo="RCH-TRN"+Math.floor(10000000+Math.random()*90000000);
    setRechargeReport((prev:any)=>[{sno:prev.length+1,transactionNo:txNo,customerId:activeSailor.id,name:activeSailor.name,pNo:activeSailor.pNo,category:activeSailor.type,rechAmount:amt},...prev]);
    toast.success(`Recharged ₹${amt} successfully!`);
    setRCustId("");setRAvAmt("");setRRechAmt("");setActiveSailor(null);
  }
  function handleRefundSubmit(){
    if(!activeSailor){toast.error("Enter a valid Customer ID!");return;}
    const balance=activeSailor.balance; const deposit=Number(refDeposit)||50;
    let refundAmt=0;
    if(refIsActive){refundAmt=balance+deposit;}
    else{refundAmt=Number(refAmt);if(isNaN(refundAmt)||refundAmt<=0){toast.error("Enter a valid refund amount!");return;}if(refundAmt>balance){toast.error("Refund exceeds balance!");return;}}
    setSailors((prev:any)=>prev.map((s:any)=>s.id===activeSailor.id?{...s,balance:refIsActive?0:s.balance-refundAmt,status:refIsActive?"Deactive":s.status}:s));
    const txNo="REF-TRN"+Math.floor(10000000+Math.random()*90000000);
    setRefundReport((prev:any)=>[{sno:prev.length+1,transactionNo:txNo,customerId:activeSailor.id,name:activeSailor.name,pNo:activeSailor.pNo,category:activeSailor.type,refundDeposit:refundAmt,date:new Date().toLocaleDateString("en-GB")},...prev]);
    toast.success(refIsActive?`Card deactivated. Refunded ₹${refundAmt}`:`Refunded ₹${refundAmt}`);
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

  function handleCreate(){if(!un||!role){toast.error("Username and Role required!");return;}if(users.some((u:any)=>u.username===un)){toast.error("Username exists!");return;}setUsers((prev:any)=>[...prev,{id:"U-"+String(prev.length+1).padStart(3,'0'),username:un,role,email,status:"Active",lastLogin:"—"}]);toast.success("User created!");handleClear();}
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
  const handleSave=()=>{localStorage.setItem("arc_settings",JSON.stringify(settings));toast.success("Settings saved!");};
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

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_ITEMS: {key:Screen;label:string;icon:React.ReactNode}[] = [
  {key:"pos",      label:"POS",      icon:<LayoutDashboard size={20}/>},
  {key:"products", label:"Product",  icon:<Package size={20}/>},
  {key:"sailor",   label:"Sailor",   icon:<Users size={20}/>},
  {key:"stock",    label:"Stock",    icon:<Warehouse size={20}/>},
  {key:"vendor",   label:"Vendor",   icon:<Truck size={20}/>},
  {key:"reports",  label:"Reports",  icon:<BarChart2 size={20}/>},
  {key:"user",     label:"User",     icon:<UserCog size={20}/>},
  {key:"card",     label:"Card",     icon:<CreditCard size={20}/>},
  {key:"settings", label:"Settings", icon:<Settings size={20}/>},
];

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
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

  const screenMap:Record<Screen,React.ReactNode>={
    pos:<POSScreen products={products} setProducts={setProducts} sailors={sailors} setSailors={setSailors}
          salesReport={salesReport} setSalesReport={setSalesReport} consoleReport={consoleReport} setConsoleReport={setConsoleReport}
          newSalesReport={newSalesReport} setNewSalesReport={setNewSalesReport}/>,
    products:<ProductDetails products={products} setProducts={setProducts} onNavigateTo={setScreen}/>,
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
                <span className="bg-[#3a8c2f] text-white text-[10px] font-bold px-2 py-0.5 rounded">superadmin</span>
                <button onClick={()=>window.location.reload()} className="bg-[#2d6a4f] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90">
                  <RefreshCw size={10}/>Refresh
                </button>
                <button onClick={()=>toast.success("Logged out!")} className="bg-[#cc2222] text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 hover:opacity-90">
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
