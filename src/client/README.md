<!--
SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors

SPDX-License-Identifier: Apache-2.0
-->

# Client Folder Structure

The client folder contains several folders for different purposes:
- `assets/`: Static assets to be served as is including images, client html templates. Runtime relevant.
- `dist/`: Compiled/minified code to be served. Runtime relevant.
- `src/`: Source code used to create `dist/`. Should not be served. Not runtime relevant.

All client code is served "static", meaning that it provides the client/browser the files as-is without interpretation/changes through the node process.
