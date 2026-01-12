;; Welsh Street Controller

;; errors
(define-constant ERR_ZERO_AMOUNT (err u500))
(define-constant ERR_NOT_CONTRACT_OWNER (err u501))
(define-constant ERR_NOT_TOKEN_OWNER (err u502))
(define-constant ERR_INSUFFICIENT_BALANCE (err u503))
(define-constant ERR_INVALID_PRINCIPAL (err u504))

;; variables
(define-data-var contract-owner principal tx-sender)

(define-public (transfer-credit 
    (amount uint) 
    (sender principal) 
    (recipient principal))
  (let (
    (sender-balance (unwrap! (contract-call? .credit get-balance sender) ERR_INSUFFICIENT_BALANCE))
  )
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq tx-sender sender) ERR_NOT_TOKEN_OWNER)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      (try! (as-contract (contract-call? .credit transfer amount sender recipient none)))
      (try! (as-contract (contract-call? .rewards update-sender-rewards sender amount)))
      (try! (as-contract (contract-call? .rewards update-recipient-rewards recipient amount)))
      (ok true)
    )
  )
)

;; custom read-only
(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (not (is-eq new-owner (var-get contract-owner))) ERR_INVALID_PRINCIPAL)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))