// Used for splitting i18nKey into tokens in Trans component
// Example:
// "Please <link>click {{location}}</link> to continue.".split(SPLIT_REGEX).filter(Boolean)
// produces
// ["Please ", "<link>", "click ", "{{location}}", "</link>", " to continue."]
const SPLIT_REGEX = /({{[\w-]+}})|(<[\w-]+>)|(<\/[\w-]+>)/g;
// Used for extracting "location" from "{{location}}"
const KEY_REGEXP = /{{([\w-]+)}}/;
// Used for extracting "link" from "<link>"
const TAG_START_REGEXP = /<([\w-]+)>/;
// Used for extracting "link" from "</link>"
const TAG_END_REGEXP = /<\/([\w-]+)>/;

export type TransNode =
  /** literal text of the translation */
  | { type: "text"; text: string }
  /** `{{name}}` placeholder, replaced by the prop `name` */
  | { type: "key"; name: string }
  /** `<name>…</name>`, wrapped by the snippet prop `name` */
  | { type: "tag"; name: string; children: TransNode[] };

/**
 * Parses a translation string into a tree of text, `{{key}}` placeholders and
 * `<tag>…</tag>` groups. `hasProp` tells which names were passed in as props.
 */
export const parseTransFormat = (
  format: string,
  hasProp: (name: string) => boolean,
): TransNode[] => {
  const stack: { name: string; children: TransNode[] }[] = [
    {
      name: "",
      children: [],
    },
  ];

  format
    .split(SPLIT_REGEX)
    .filter(Boolean)
    .forEach((match) => {
      const tagStartMatch = match.match(TAG_START_REGEXP);
      const tagEndMatch = match.match(TAG_END_REGEXP);
      const keyMatch = match.match(KEY_REGEXP);

      if (tagStartMatch !== null) {
        // The match is <tag>. Set the tag name as the name if it's one of the
        // props, e.g. for "Please <link>click the button</link> to continue"
        // tagStartMatch[1] = "link" and props contain "link" then it will be
        // pushed to stack.
        const name = tagStartMatch[1];
        if (hasProp(name)) {
          stack.push({
            name,
            children: [],
          });
        } else {
          console.warn(
            `Trans: missed to pass in prop ${name} for interpolating ${format}`,
          );
        }
      } else if (tagEndMatch !== null) {
        // If tag end match is found, the collected children are wrapped in a
        // tag node, which the component renders through the snippet prop with
        // the tag's name, e.g. format = "Please <link>click the button</link>
        // to continue" is rendered as `link(<children>)`.
        const name = tagEndMatch[1];
        if (name === stack[stack.length - 1].name) {
          const item = stack.pop()!;
          stack[stack.length - 1].children.push({
            type: "tag",
            name: item.name,
            children: item.children,
          });
        } else {
          console.warn(
            `Trans: unexpected end tag ${match} for interpolating ${format}`,
          );
        }
      } else if (keyMatch !== null) {
        // The match is for {{key}}. Check if the key is present in props e.g.
        // format = "Hello {{name}}", key = "name" and props.name = "Excalidraw"
        // then its prop value will be rendered as "Hello Excalidraw"
        const name = keyMatch[1];
        if (hasProp(name)) {
          stack[stack.length - 1].children.push({ type: "key", name });
        } else {
          console.warn(
            `Trans: key ${name} not in props for interpolating ${format}`,
          );
        }
      } else {
        // If none of cases match means we just need to push the string
        // to stack eg - "Hello {{name}} Whats up?" "Hello", "Whats up" will be pushed
        stack[stack.length - 1].children.push({ type: "text", text: match });
      }
    });

  if (stack.length !== 1) {
    console.warn(`Trans: stack not empty for interpolating ${format}`);
  }

  return stack[0].children;
};
