# Food Rescue canonical operational workflow

`donations` and `assignments` are the authoritative operational records used
by the unified partner workspace (`frontend/js/partner.js`).

1. A business creates a donation (`available`).
2. An NGO or volunteer accepts it and an assignment is created (`ASSIGNED`).
3. The assignment progresses through pickup verification, transit, destination
   verification, proof upload, and `DELIVERED`.
4. Distribution completion requires delivery proof. It updates the assignment
   to `COMPLETED` and the donation to `completed` in one transaction.

Older generic pickup/assignment modules are isolated compatibility code. No
canonical dashboard imports their frontend clients.
