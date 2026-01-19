;; Welsh Street Credit

(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token credit)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u600))
(define-constant ERR_NOT_CONTRACT_OWNER (err u601))
(define-constant ERR_NOT_TOKEN_OWNER (err u602))
(define-constant ERR_NOT_AUTHORIZED (err u603))
(define-constant ERR_INVALID_PRINCIPAL (err u604))

;; metadata
(define-constant TOKEN_DECIMALS u6)
(define-constant TOKEN_NAME "Credit")
(define-constant TOKEN_SYMBOL "CREDIT")

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://gateway.lighthouse.storage/ipfs/bafkreia3r5yfzb3r4ixfzw35s76ktvjuf6v4zhug76ck2bgd5ypyx2faea"))

(define-public (burn (amount uint))
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (try! (ft-burn? credit amount tx-sender))
      (ok {
        amount: amount
      })
    )
)

(define-public (mint (amount uint))
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (try! (ft-mint? credit amount tx-sender))
      (ok {
        amount: amount
      })
    )
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (not (is-eq new-owner (var-get contract-owner))) ERR_INVALID_PRINCIPAL)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (var-set token-uri (some value))
    (ok true)
  )
)

(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (or (is-eq contract-caller .exchange) 
                  (is-eq contract-caller .controller)) ERR_NOT_AUTHORIZED)
    (try! (ft-transfer? credit amount sender recipient))
    (match memo
      memo-content (print memo-content)
      0x
    )
    (ok true)
  )
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance credit who)))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS))

(define-read-only (get-name)
  (ok TOKEN_NAME))

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply credit)))