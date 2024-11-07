// Ported by Copilot from https://github.com/jakobhellermann/pretty-type-name/blob/main/src/lib.rs
export function prettyTypeName(typeName: string): string {
  if (typeName.endsWith('::{{closure}}')) {
    const before = typeName.slice(0, -12); // Remove "::{{closure}}"
    return `${prettyTypeName(before)}::{{closure}}`;
  }

  let shortName = '';
  let remainder = typeName;

  const specialChars = ['<', '>', '(', ')', '[', ']', ',', ';'];

  while (true) {
    let index = -1;
    for (const char of specialChars) {
      const charIndex = remainder.indexOf(char);
      if (charIndex !== -1 && (index === -1 || charIndex < index)) {
        index = charIndex;
      }
    }

    if (index === -1) break;

    const path = remainder.slice(0, index);
    const newRemainder = remainder.slice(index);

    shortName += path.split(':').pop();
    const character = newRemainder[0];
    shortName += character;

    if (character === ',' || character === ';') {
      shortName += ' ';
      remainder = newRemainder.slice(2);
    } else {
      remainder = newRemainder.slice(1);
    }
  }

  if (remainder.length > 0) {
    shortName += remainder.split(':').pop();
  }

  return shortName;
}
