/**
 * Reports use PDF StandardFonts (WinAnsi). Substitute meaningful notation
 * explicitly and represent every unsupported Unicode glyph as [U+XXXX].
 * This is an auditable fallback, NOT full Unicode font embedding.
 */
const symbolic:Record<string,string>={
  '→':' -> ','←':' <- ','↔':' <-> ','↑':' up ','↓':' down ',
  '⇒':' => ','⇔':' <=> ','–':' - ','—':' - ','−':'-',
  '“':'"','”':'"','„':'"','‘':"'",'’':"'",'…':'...',
  '≤':'<=','≥':'>=','≠':'!=','≈':'~','≡':'=',
  'Δ':'Delta','δ':'delta','Σ':'Sigma','σ':'sigma','π':'pi','µ':'micro',
  '∞':'infinity','∑':'sum','√':'sqrt','∩':'intersection','∪':'union',
  '•':' - ','◦':'-','✓':'[OK]','✔':'[OK]','✗':'[X]','✘':'[X]',
  '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9',
  '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9',
  '⁻':'-', '₊':'+', '₋':'-', '₌':'=',
  ' ':' ','­':'-'
};
export function pdfSafeText(value:string):string{
  let result='';
  for(const char of value){
    if(symbolic[char]!==undefined){result+=symbolic[char];continue;}
    const point=char.codePointAt(0)!;
    if(point>=0x20&&point<=0x7e||point>=0xa0&&point<=0xff||point===0x20ac){
      result+=char;
      continue;
    }
    const decomposed=char.normalize('NFKD').replace(/[̀-ͯ]/g,'');
    if(decomposed!==char&&/^[ -~]+$/.test(decomposed)){
      result+=decomposed;continue;
    }
    result+='[U+'+point.toString(16).toUpperCase().padStart(4,'0')+']';
  }
  return result;
}
