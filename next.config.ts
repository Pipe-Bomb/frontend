import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
	/* config options here */
	output: "standalone",
	allowedDevOrigins: ["127.0.0.1", "local.eyezah.net"],
	webpack: (config) => {
		const root = process.cwd();

		config.resolve.alias["@tanstack/react-query"] = resolve(
			root,
			"node_modules/@tanstack/react-query",
		);
		config.resolve.alias["react"] = resolve(root, "node_modules/react");
		return config;
	},
	experimental: {},
	turbopack: {
		resolveAlias: {
			react: "./node_modules/react",
			"@tanstack/react-query": "./node_modules/@tanstack/react-query",
		},
	},
};

export default nextConfig;
