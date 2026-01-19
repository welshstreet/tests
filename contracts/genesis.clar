;; Welsh Street Liquidity Generation Event (Genesis)

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u500))
(define-constant ERR_NOT_CONTRACT_OWNER (err u501))
(define-constant ERR_NOT_ACTIVE_FUND (err u502))

;; metadata
(define-constant CONTRACT_OWNER tx-sender)
(define-constant TOTAL_STREET u1000000000000000)

;; variables
(define-data-var claim-active bool false)
(define-data-var contribute-active bool true)
(define-data-var total-contribution uint u0)

(define-map balances
    { address: principal }
    { 
      balance: uint,
      claimed: uint
    }
)

(define-public (claim)
    (let (
        (user-balance-info (default-to { balance: u0 } (map-get? balances { address: tx-sender })))
        (user-balance (get balance user-balance-info))
        (total-contrib (var-get total-contribution))
        (user-claim (if (> total-contrib u0)
                            (/ (* user-balance TOTAL_STREET) total-contrib)
                            u0))
    )
    (begin
        (asserts! (is-eq (var-get claim-active) true) ERR_NOT_ACTIVE_FUND)
        (asserts! (> user-balance u0) ERR_ZERO_AMOUNT)
        (try! (transformer .street user-claim tx-sender))
        (map-set balances { address: tx-sender } {
            balance: u0,
            claimed: user-claim
            })
        (ok {
            amount: user-claim,
            balance: user-balance
        })
    )
    )
)

(define-public (contribute (amount uint))
    (let (
        (current-total (var-get total-contribution))
        (current-balance (default-to { balance: u0 } (map-get? balances { address: tx-sender })))
        (previous-balance (get balance current-balance))
        (new-balance (+ previous-balance amount))
        (new-total (+ current-total amount))
    )
    (begin
        (asserts! (is-eq (var-get contribute-active) true) ERR_NOT_ACTIVE_FUND)
        (asserts! (> amount u0) ERR_ZERO_AMOUNT)
        (try! (contract-call? .welshcorgicoin transfer amount tx-sender .genesis none))
        (var-set total-contribution new-total)
        (map-set balances { address: tx-sender } {
            balance: new-balance,
            claimed: u0
        })
    (ok {
        amount: amount,
        total: new-total
        })
    )
    )
)

(define-public (transformer
    (token <sip-010>)
    (amount uint)
    (recipient principal)
    )
    (as-contract (contract-call? token transfer amount tx-sender recipient none))
)

(define-public (withdrawal)
    (let (
        (balance (unwrap-panic (contract-call? .welshcorgicoin get-balance .genesis)))
    )
    (begin
        (asserts! (> balance u0) ERR_ZERO_AMOUNT)
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
        (try! (transformer .welshcorgicoin balance CONTRACT_OWNER))
        (ok balance)
    )
    )
)

;; custom read-only
(define-read-only (get-blocks)
    (ok {
        bitcoin-block: burn-block-height,
        stacks-block: stacks-block-height
    })
)

(define-public (set-claim-active)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
        (if (var-get claim-active)
            (begin
                (var-set claim-active false)
            )
            (begin
                (var-set claim-active true)
            )
        )
        (ok (var-get claim-active))
    )
)

(define-public (set-contribute-active)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
        (if (var-get contribute-active)
            (begin
                (var-set contribute-active false)
            )
            (begin
                (var-set contribute-active true)
            )
        )
        (ok (var-get contribute-active))
    )
)

(define-read-only (get-claim-active)
    (ok (var-get claim-active))
)

(define-read-only (get-contribute-active)
    (ok (var-get contribute-active))
)

(define-read-only (get-total-contribution)
    (ok (var-get total-contribution))
)

(define-read-only (get-user-balance (address principal))
    (ok (default-to { balance: u0, claimed: u0 } (map-get? balances { address: address }))))