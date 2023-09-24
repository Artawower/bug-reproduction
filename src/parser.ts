// Simple codemirror parser
// This is a simple parser for codemirror that will highlight the syntax of the
import {
  HighlightStyle,
  Language,
  LanguageSupport,
  defineLanguageFacet,
  syntaxHighlighting,
} from "@codemirror/language";
import {
  NodeType,
  Tree,
  Input,
  Parser,
  PartialParse,
  TreeFragment,
} from "@lezer/common";
import { OrgNode, NodeType as OrgNodeType, parse } from "org-mode-ast";
import { Tag, styleTags } from "@lezer/highlight";

export const nodeIds = Object.values(OrgNodeType);
export const getOrgNodeId = (node: OrgNode): number => {
  return nodeIds.indexOf(node.type);
};

class OrgNodeParser extends Parser {
  createParse(
    input: Input,
    _fragments: readonly TreeFragment[],
    ranges: readonly { from: number; to: number }[]
  ): PartialParse {
    const doc = input.read(0, input.length);
    const parsedDoc = parse(doc);
    console.log("✎: [line 37][parser.ts] ranges: ", ranges);

    return {
      advance(): Tree | null {
        const tree = convertOrgModeTreeToCmTree(parsedDoc);
        console.log("✎: [line 53][parser.ts] tree: ", tree);
        console.log(
          "✎: [line 43][parser.ts] parsedDoc: ",
          parsedDoc.toString()
        );
        console.log("-".repeat(80));
        console.log(
          "✎: [line 48][parser.ts] tree: ",
          JSON.stringify(getPrintedTreeProperties(tree), null, 2)
        );
        return tree;
      },
      parsedPos: input.length,
      stopAt(pos: number): void {
        // console.log('✎: [line 39][parser.ts] pos: ', pos);
      },
      stoppedAt: input.length,
    };
  }
}

console.log("✎: [line 64][parser.ts<2>] nodeIds: ", nodeIds);
export const orgTags = nodeIds.reduce((acc, cur) => {
  acc[cur] = Tag.define();
  return acc;
}, {} as Record<OrgNodeType, Tag>);

const styles = styleTags(orgTags);
function convertOrgModeTreeToCmTree(orgNode: OrgNode): Tree {
  const sectionChildren = [];
  if (orgNode.title) {
    sectionChildren.push(orgNode.title);
  }

  if (orgNode.section) {
    sectionChildren.push(orgNode.section);
  }

  const children = orgNode.children ?? sectionChildren;

  return new Tree(
    NodeType.define({
      id: getOrgNodeId(orgNode),
      name: orgNode.type,
      top: orgNode.is(OrgNodeType.Root),
      props: [styles],
    }),
    children?.map((c) => convertOrgModeTreeToCmTree(c)) ?? [],
    children.map((c) => c.start - orgNode.start),

    // With this positions i can see highlight only when there is text before *hello*
    // For example 123456 *Hello*
    // children.map((c) => c.start),

    // When I specify this range, I can see the highlighting, but it's not correct
    // It doesn't start at 0..but from 1
    // orgNode.is(OrgNodeType.Bold) ? [0, 7] : [orgNode.start, orgNode.end],
    orgNode.length
  );
}

function getPrintedTreeProperties(cur: any): Object {
  const tags = Object.values(cur.type?.props ?? {}).length
    ? Object.values(cur.type?.props)[0].tags.map((t: { id: number }) => ({
        id: t.id,
      }))
    : null;

  return {
    length: cur.length,
    positions: cur.positions,
    type: {
      flags: cur.type.flags,
      id: cur.type.id,
      name: cur.type.name,
      tags,
    },
    children: cur.children?.map(getPrintedTreeProperties),
  };
}

const facet = defineLanguageFacet();
const parser = new OrgNodeParser();
const orgModeLanguage = new Language(facet, parser, [], "org-mode");

const highlightStyle = HighlightStyle.define([
  {
    tag: orgTags.bold,
    color: "green",
  },
  {
    tag: orgTags.title,
    color: "green",
  },
  {
    tag: orgTags.italic,
    fontStyle: "italic",
  },
]);

export function orgMode(): LanguageSupport {
  return new LanguageSupport(orgModeLanguage, [
    syntaxHighlighting(highlightStyle),
  ]);
}
