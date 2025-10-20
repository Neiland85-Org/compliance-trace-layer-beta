#!/bin/bash
HEADER="/**
Compliance Trace Layer — v0.1.0-beta

© 2025 Neil Muñoz Lago. All rights reserved.

Private research prototype for environmental blockchain visualization and

carbon-credit traceability. Developed using React Three Fiber, Framer Motion,

and Node.js backend services for compliance data integrity.

This software is proprietary and not open source.

Unauthorized reproduction, modification, or redistribution of this code,

in whole or in part, is strictly prohibited without prior written consent

from the author.
*/"

for file in $(find ./frontend ./backend -type f 
−
𝑛
𝑎
𝑚
𝑒
"
∗
.
𝑗
𝑠
"
−
𝑜
−
𝑛
𝑎
𝑚
𝑒
"
∗
.
𝑗
𝑠
𝑥
"
−
𝑜
−
𝑛
𝑎
𝑚
𝑒
"
∗
.
𝑡
𝑠
"
−
𝑜
−
𝑛
𝑎
𝑚
𝑒
"
∗
.
𝑡
𝑠
𝑥
"
−name"∗.js"−o−name"∗.jsx"−o−name"∗.ts"−o−name"∗.tsx"); do
if ! grep -q "Compliance Trace Layer" "$file"; then
echo "Adding header to $file"
echo "$HEADER" | cat - "$file" > temp && mv temp "$file"
fi
done
