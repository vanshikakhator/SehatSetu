const normalizeMed = (name) => {
  return name.toLowerCase()
    .replace(/\b(tab|tablet|cap|capsule|syr|syrup|inj|injection)\b\.?/g, '')
    .replace(/[\.\,\-\+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

console.log(normalizeMed("Tab. Dolo-650"));
console.log(normalizeMed("DOLO 650"));
console.log(normalizeMed("Dolo-650"));
console.log(normalizeMed("dolo 650"));
console.log(normalizeMed("Ultra-Fine+"));
console.log(normalizeMed("tab.ultrafen-plus"));
