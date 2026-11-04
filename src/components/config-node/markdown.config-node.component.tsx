import { MarkdownConfigNode as MarkdownConfigNodeType } from "pipe-bomb-tanstack-client";
import Link from "next/link";
import { Markdown } from "@/components/markdown/markdown.component";

interface Props {
	node: MarkdownConfigNodeType;
}

export function MarkdownConfigNode({ node }: Props) {
	return <Markdown>{node.content}</Markdown>;
}
