import { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile, readdir } from "fs/promises";
import { parseDocument, YAMLMap } from "yaml";

export default async (_request: VercelRequest, response: VercelResponse) => {
  const doc = parseDocument(
    (await readFile(__dirname + "/openapi.yaml")).toString()
  );

  const paths = doc.get("paths") as YAMLMap<string, {}>;
  for (const filename of await readdir(__dirname)) {
    const name = filename.substr(0, filename.lastIndexOf("."));
    if (name != "openapi.yaml" && filename.endsWith(".ts")) {
      const path = `/api/${name}`;
      let value = paths.get(path) as YAMLMap<string, {}>;
      if (!value) {
        value = new YAMLMap();
        value.set(
          "operationId",
          "get" + name[0].toUpperCase() + name.substring(1)
        );
        value.set(
          "responses",
          parseDocument(
            JSON.stringify({
              default: {
                description: "Ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            })
          )
        );
      }
      paths.set(path, value);
    }
  }

  response.status(200).json(doc);
};
