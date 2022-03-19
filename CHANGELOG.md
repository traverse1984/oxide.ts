# Patch 0.9.12

Changes to Option/Result methods:

-  `is` has been deprecated and replaced by `isLike`.
-  `eq` has been deprecated and replaced by `equals`.
-  `neq` has been deprecated.

# Patch 0.9.11

Fix publishing mistake.

# Patch 0.9.10

Deprecated guarded functions.

# Patch 0.9.8

Added `.all`, `.any` and `.safe` methods to `Option` and `Result`. Complete
with tests and usage examples.

# Patch 0.9.7

After lots of great feedback, I've decided that the `snake_case` API will be
removed in the 1.0 release. Patch 0.9.7 moves `camelCase` to the front seat
without breaking anything.
