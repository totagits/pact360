# CSV Migration Specification

This document details headers and constraints for the CSV Data Migration tool.

## Required Headers

- `name`: Item description.
- `assetTag`: Unique physical asset tag.
- `category`: Matches configured category names (e.g. `Vehicles`, `Laptops`).
- `office`: Matches registered Country or Field offices.

## Optional Headers
- `serialNumber`
- `purchaseCost`
- `purchaseDate` (Format: YYYY-MM-DD)
- `donor`
- `grant`
- `project`

## Error Codes
- `Duplicate`: Tag or Serial already exists in DB.
- `Missing Required`: Required header left empty.
- `Invalid Format`: Purchase cost is negative or date is malformed.
