;; Welsh Street Exchange

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u700))
(define-constant ERR_NOT_CONTRACT_OWNER (err u701))
(define-constant ERR_NOT_INITIALIZED (err u702))
(define-constant ERR_ALREADY_INITIALIZED (err u703))
(define-constant ERR_NOT_TREASURY (err u704))
(define-constant ERR_LOCKED_TREASURY (err u705))
(define-constant ERR_INVALID_PRINCIPAL (err u706))
(define-constant ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY (err u707))
(define-constant ERR_INVALID_AMOUNT (err u787))

;; metadata
(define-constant BASIS u10000)
(define-constant DECIMALS u1000000)
(define-constant MAX_FEE u200)
(define-constant MAX_REV u200)
(define-constant MAX_TAX u200)
(define-constant MIN_FEE u50)
(define-constant MIN_REV u50)
(define-constant MIN_TAX u50)

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var fee uint u100)
(define-data-var locked-a uint u0)
(define-data-var locked-b uint u0)
(define-data-var reserve-a uint u0)
(define-data-var reserve-b uint u0)
(define-data-var rev uint u100)
(define-data-var tax uint u100)

;; treasury account
(define-data-var treasury-address principal (var-get contract-owner))
(define-data-var treasury-locked bool false)


;; exchange functions 
(define-public (burn-liquidity (amount uint))
  (begin
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (try! (contract-call? .rewards update-burn-rewards tx-sender amount))
    (try! (contract-call? .credit transfer amount tx-sender .exchange none))
    (try! (as-contract (contract-call? .credit burn amount)))
    (ok {
      amount-lp: amount,
    })
  )
)

(define-public (lock-liquidity (amount-a uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (amount-b (if (is-eq res-a u0) u0 (/ (* amount-a res-b) res-a)))
  )
  (begin
    (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
    (asserts! (> amount-b u0) ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY)
    (asserts! (if (is-eq res-a u0)
      (is-eq tx-sender (var-get contract-owner))
      true) ERR_NOT_INITIALIZED)
    (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .exchange none))
    (try! (contract-call? .street transfer amount-b tx-sender .exchange none))
    (var-set locked-a (+ lock-a amount-a))
    (var-set locked-b (+ lock-b amount-b))
    (var-set reserve-a (+ res-a amount-a))
    (var-set reserve-b (+ res-b amount-b))
    (ok {
      amount-a: amount-a,
      amount-b: amount-b,
      })
    )
  )
)

(define-public (provide-initial-liquidity (amount-a uint) (amount-b uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (total-supply-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (amount-lp (sqrti (* amount-a amount-b)))
  )
  (begin
    (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
    (asserts! (> amount-b u0) ERR_ZERO_AMOUNT)
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (or
      (and (is-eq res-a u0) (is-eq res-b u0))
      (is-eq total-supply-lp u0))
      ERR_ALREADY_INITIALIZED)
    (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .exchange none))
    (try! (contract-call? .street transfer amount-b tx-sender .exchange none))
    (try! (contract-call? .credit mint amount-lp))
    (try! (contract-call? .rewards update-provide-rewards tx-sender amount-lp))
    (var-set reserve-a (+ amount-a lock-a))
    (var-set reserve-b (+ amount-b lock-b))
    (ok {
      amount-a: amount-a,
      amount-b: amount-b,
      amount-lp: amount-lp})
    )
  )
)

(define-public (provide-liquidity (amount-a uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (avail-a (if (>= res-a lock-a) (- res-a lock-a) u0))
    (avail-b (if (>= res-b lock-b) (- res-b lock-b) u0))
    (total-supply-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (amount-b (if (is-eq avail-a u0) u0 (/ (* amount-a avail-b) avail-a)))
    (amount-lp (if (or (is-eq total-supply-lp u0) (and (is-eq avail-a u0) (is-eq avail-b u0)))
      (sqrti (* amount-a amount-b))
      (let (
        (lp-from-a (/ (* amount-a total-supply-lp) avail-a))
        (lp-from-b (/ (* amount-b total-supply-lp) avail-b))
      )
      (if (< lp-from-a lp-from-b) lp-from-a lp-from-b))))
  )
  (begin
    (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
    (asserts! (> amount-b u0) ERR_INSUFFICIENT_AVAILABLE_LIQUIDITY)
    (asserts! (if (and (is-eq avail-a u0) (is-eq res-a u0))
        (is-eq tx-sender (var-get contract-owner))
        true) ERR_NOT_INITIALIZED)
      (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .exchange none))
      (try! (contract-call? .street transfer amount-b tx-sender .exchange none))
      (try! (contract-call? .credit mint amount-lp))
      (try! (contract-call? .rewards update-provide-rewards tx-sender amount-lp))
      (var-set reserve-a (+ res-a amount-a))
      (var-set reserve-b (+ res-b amount-b))
    (ok {
      amount-a: amount-a,
      amount-b: amount-b,
      amount-lp: amount-lp})
    )
  )
)

(define-public (remove-liquidity (amount-lp uint))
  (let (
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (avail-a (if (>= res-a lock-a) (- res-a lock-a) u0))
    (avail-b (if (>= res-b lock-b) (- res-b lock-b) u0))
    (total-supply-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (remove-a (/ (* amount-lp avail-a) total-supply-lp))
    (remove-b (/ (* amount-lp avail-b) total-supply-lp))
    (tax-a (/ (* remove-a (var-get tax)) BASIS))
    (tax-b (/ (* remove-b (var-get tax)) BASIS))
    (amount-a (- remove-a tax-a))
    (amount-b (- remove-b tax-b))
  )
    (begin
      (asserts! (> amount-lp u0) ERR_ZERO_AMOUNT)
      (try! (contract-call? .credit transfer amount-lp tx-sender .exchange none))
      (try! (transformer .welshcorgicoin amount-a tx-sender))
      (try! (transformer .street amount-b tx-sender))
      (try! (contract-call? .rewards update-remove-rewards tx-sender amount-lp))
      (try! (as-contract (contract-call? .credit burn amount-lp)))
      (var-set reserve-a (if (>= res-a amount-a) (- res-a amount-a) u0))
      (var-set reserve-b (if (>= res-b amount-b) (- res-b amount-b) u0))
      (var-set locked-a (+ lock-a tax-a))
      (var-set locked-b (+ lock-b tax-b))
      (ok { 
        amount-a: amount-a,
        amount-b: amount-b,
        amount-lp: amount-lp,
        tax-a: tax-a,
        tax-b: tax-b
      })
    )
  )
)

(define-public (swap-a-b (amount-a uint))
  (let (
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (fee-total (/ (* amount-a (+ (var-get fee) (var-get rev))) BASIS))
    (rev-a (/ (* amount-a (var-get rev)) BASIS))
    (fee-a (/ (* amount-a (var-get fee)) BASIS))
    (amount-a-net (- amount-a fee-total))
    (num (* amount-a-net res-b))
    (den (+ res-a amount-a-net))
    (amount-b (/ num den))
    (amount-b-net amount-b)
    (res-a-new (+ res-a amount-a-net))
    (res-b-new (- res-b amount-b-net))
    (lock-a-new (if (> res-a u0) (/ (* lock-a res-a-new) res-a) lock-a))
    (lock-b-new (if (> res-b u0) (/ (* lock-b res-b-new) res-b) lock-b))
    (treasury (var-get treasury-address))
  )
    (begin
      (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
      (asserts! (> amount-b-net u0) ERR_INVALID_AMOUNT)
      (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .exchange none))
      (try! (transformer .welshcorgicoin rev-a treasury))
      (try! (transformer .welshcorgicoin fee-a .rewards))
      (try! (transformer .street amount-b-net tx-sender))
      (try! (contract-call? .rewards update-rewards-a fee-a))
      (var-set reserve-a res-a-new)
      (var-set reserve-b res-b-new)
      (var-set locked-a lock-a-new)
      (var-set locked-b lock-b-new)
      (ok {
        amount-a: amount-a,
        amount-b: amount-b-net,
        fee-a: fee-a,
        res-a: res-a,
        res-a-new: res-a-new,
        res-b: res-b,
        res-b-new: res-b-new,
        rev-a: rev-a })
    )
  )
)

(define-public (swap-b-a (amount-b uint))
  (let (
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (fee-total (/ (* amount-b (+ (var-get fee) (var-get rev))) BASIS))
    (rev-b (/ (* amount-b (var-get rev)) BASIS))
    (fee-b (/ (* amount-b (var-get fee)) BASIS))
    (amount-b-net (- amount-b fee-total))
    (num (* amount-b-net res-a))
    (den (+ res-b amount-b-net))
    (amount-a (/ num den))
    (amount-a-net amount-a)
    (res-a-new (- res-a amount-a-net))
    (res-b-new (+ res-b amount-b-net))
    (lock-a-new (if (> res-a u0) (/ (* lock-a res-a-new) res-a) lock-a))
    (lock-b-new (if (> res-b u0) (/ (* lock-b res-b-new) res-b) lock-b))
    (treasury (var-get treasury-address))
  )
    (begin
      (asserts! (> amount-a-net u0) ERR_ZERO_AMOUNT)
      (asserts! (> amount-b u0) ERR_INVALID_AMOUNT)
      (try! (contract-call? .street transfer amount-b tx-sender .exchange none))
      (try! (transformer .street rev-b treasury))
      (try! (transformer .street fee-b .rewards))
      (try! (transformer .welshcorgicoin amount-a-net tx-sender))
      (try! (contract-call? .rewards update-rewards-b fee-b))
      (var-set reserve-a res-a-new)
      (var-set reserve-b res-b-new)
      (var-set locked-a lock-a-new)
      (var-set locked-b lock-b-new)
      (ok {
        amount-a: amount-a-net,
        amount-b: amount-b,
        fee-b: fee-b,
        res-a: res-a,
        res-a-new: res-a-new,
        res-b: res-b,
        res-b-new: res-b-new,
        rev-b: rev-b})
    )
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

(define-public (set-exchange-fee (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (<= amount MAX_FEE) ERR_INVALID_AMOUNT )
    (asserts! (>= amount MIN_FEE) ERR_INVALID_AMOUNT )
    (var-set fee amount)
    (ok {fee: amount})
  )
)

(define-public (set-exchange-rev (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (<= amount MAX_REV) ERR_INVALID_AMOUNT )
    (asserts! (>= amount MIN_REV) ERR_INVALID_AMOUNT )
    (var-set rev amount)
    (ok {rev: amount})
  )
)

(define-public (set-exchange-tax (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (<= amount MAX_TAX) ERR_INVALID_AMOUNT )
    (asserts! (>= amount MIN_TAX) ERR_INVALID_AMOUNT )
    (var-set tax amount)
    (ok {tax: amount})
  )
)

(define-public (set-treasury-address (new-treasury principal))
  (begin
    (asserts! (is-eq (var-get treasury-address) tx-sender) ERR_NOT_TREASURY)
    (if (var-get treasury-locked)
        ERR_LOCKED_TREASURY
        (begin
          (var-set treasury-address new-treasury)
          (ok new-treasury)
        )
    )
  )
)

(define-public (set-treasury-locked)
  (begin
    (asserts! (is-eq (var-get treasury-address) tx-sender) ERR_NOT_TREASURY)
    (if (var-get treasury-locked)
        ERR_LOCKED_TREASURY
        (begin
          (var-set treasury-locked true)
          (ok true)
        )
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

;; custom read-only
(define-read-only (get-blocks)
  (ok {
    bitcoin-block: burn-block-height,
    stacks-block: stacks-block-height
  }))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-exchange-info)
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
  )
    (ok {
      avail-a: (if (>= res-a lock-a) (- res-a lock-a) u0),
      avail-b: (if (>= res-b lock-b) (- res-b lock-b) u0),
      fee: (var-get fee),
      locked-a: lock-a,
      locked-b: lock-b,
      reserve-a: res-a,
      reserve-b: res-b,
      revenue: (var-get rev),
      tax: (var-get tax)
    })
  )
)

(define-read-only (get-treasury-address)
  (ok (var-get treasury-address)))

(define-read-only (get-treasury-locked)
  (ok (var-get treasury-locked)))