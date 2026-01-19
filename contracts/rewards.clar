;; Welsh Street Rewards

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u800))
(define-constant ERR_NOT_CONTRACT_OWNER (err u801))
(define-constant ERR_EMISSION_INTERVAL (err u802))
(define-constant ERR_NOT_AUTHORIZED (err u803))
(define-constant ERR_INVALID_PRINCIPAL (err u804))

;; metadata
(define-constant PRECISION u1000000000)
(define-constant EMISSION_AMOUNT u10000000000)

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var global-index-a uint u0)
(define-data-var global-index-b uint u0)
(define-data-var last-mint-epoch uint u0)
(define-data-var total-distributed-a uint u0)
(define-data-var total-distributed-b uint u0)
(define-data-var total-claimed-a uint u0)
(define-data-var total-claimed-b uint u0)

(define-map user-rewards
  { account: principal }
  {
    balance: uint,
    block: uint,
    debt-a: uint,
    debt-b: uint,
    index-a: uint,
    index-b: uint
  }
)

;; reward functions
(define-public (claim-rewards)
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance tx-sender)))
    (info (default-to {
      balance: u0,
      block: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? user-rewards { account: tx-sender })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (debt-a (get debt-a info))
    (debt-b (get debt-b info))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance (- current-global-b user-index-b)) PRECISION))
    (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
    (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
  )
    (begin
      (if (> unclaimed-a u0)
        (try! (transformer .welshcorgicoin unclaimed-a tx-sender))
        true
      )
      (if (> unclaimed-b u0)
        (try! (transformer .street unclaimed-b tx-sender))
        true
      )
      (var-set total-claimed-a (+ (var-get total-claimed-a) unclaimed-a))
      (var-set total-claimed-b (+ (var-get total-claimed-b) unclaimed-b))
      (map-set user-rewards { account: tx-sender } {
        balance: balance,
        block: (get block info),
        debt-a: (+ debt-a unclaimed-a),
        debt-b: (+ debt-b unclaimed-b),
        index-a: user-index-a,
        index-b: user-index-b
        })
      (ok {
        amount-a: unclaimed-a,
        amount-b: unclaimed-b,
        })  
    )
  )
)

(define-public (cleanup-rewards)
  (let (
    (actual-a (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)))
    (actual-b (unwrap-panic (contract-call? .street get-balance .rewards)))
    (claimed-a (var-get total-claimed-a))
    (claimed-b (var-get total-claimed-b))
    (distributed-a (var-get total-distributed-a))
    (distributed-b (var-get total-distributed-b))
    (dust-threshold u10000)
    (outstanding-a (- distributed-a claimed-a))
    (outstanding-b (- distributed-b claimed-b))
    (cleanup-a (if (> actual-a outstanding-a)
                  (- actual-a outstanding-a)
                  (if (and (is-eq actual-a outstanding-a)
                          (< outstanding-a dust-threshold))
                      actual-a
                      u0)))
    (cleanup-b (if (> actual-b outstanding-b)
                  (- actual-b outstanding-b)
                  (if (and (is-eq actual-b outstanding-b)
                          (< outstanding-b dust-threshold))
                      actual-b
                      u0)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
      (if (> cleanup-a u0)
        (try! (as-contract (update-rewards-a cleanup-a)))
        true)
      (if (> cleanup-b u0)
        (try! (as-contract (update-rewards-b cleanup-b)))
        true)
      (ok {
        amount-a: cleanup-a,
        amount-b: cleanup-b,
      })
    )
  )
)

(define-public (donate-rewards (amount-a uint) (amount-b uint))
    (begin
      (if (> amount-a u0)
      (begin
        (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .rewards none))
        (try! (as-contract (update-rewards-a amount-a)))
      )
        true
      )
      (if (> amount-b u0)
      (begin
        (try! (contract-call? .street transfer amount-b tx-sender .rewards none))
        (try! (as-contract (update-rewards-b amount-b)))
      )
        true
      )
    (ok {
      amount-a: amount-a,
      amount-b: amount-b
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

(define-public (transformer
    (token <sip-010>)
    (amount uint)
    (recipient principal)
  )
  (as-contract (contract-call? token transfer amount tx-sender recipient none))
)

(define-public (update-burn-rewards (user principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance user)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (map-get? user-rewards { account: user }))
    (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (new-balance (- balance amount))
    (other-lp (- total-lp balance))
  )
    (begin
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (if (is-some info)
        (let (
          (data (unwrap-panic info))
          (debt-a (get debt-a data))
          (debt-b (get debt-b data))
          (index-a (get index-a data))
          (index-b (get index-b data))
          (earned-a (/ (* balance (- global-a index-a)) PRECISION))
          (earned-b (/ (* balance (- global-b index-b)) PRECISION))
          (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
          (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
          (forfeit-a (/ (* unclaimed-a amount) balance))
          (forfeit-b (/ (* unclaimed-b amount) balance))
          (redistributed-a (if (> other-lp u0)
                        (/ (* forfeit-a PRECISION) other-lp)
                        u0))
          (redistributed-b (if (> other-lp u0)
                        (/ (* forfeit-b PRECISION) other-lp)
                        u0))
        )
          (begin
            (if (> forfeit-a u0)
              (begin
                (var-set global-index-a (+ global-a redistributed-a)))
              true)
            (if (> forfeit-b u0)
              (begin
                (var-set global-index-b (+ global-b redistributed-b)))
              true)
            (map-delete user-rewards { account: user })
            (let (
              (new-global-a (var-get global-index-a))
              (new-global-b (var-get global-index-b))
              (preserve-a (- unclaimed-a forfeit-a))
              (preserve-b (- unclaimed-b forfeit-b))
              (preserve-idx-a (if (and (> new-balance u0) (> preserve-a u0))
                          (- new-global-a (/ (* preserve-a PRECISION) new-balance))
                          new-global-a))
              (preserve-idx-b (if (and (> new-balance u0) (> preserve-b u0))
                          (- new-global-b (/ (* preserve-b PRECISION) new-balance))
                          new-global-b))
            )
              (if (> new-balance u0)
                (map-set user-rewards
                  { account: user }
                  { balance: new-balance,
                    block: block,
                    debt-a: u0,
                    debt-b: u0, 
                    index-a: preserve-idx-a,
                    index-b: preserve-idx-b
                  })
                true)
            )
          )
        )
        true
      )
      (ok true)
    )
  )
)

(define-public (update-emission-rewards)
  (let (
      (current-epoch (unwrap-panic (contract-call? .street get-current-epoch)))
      (last-mint (var-get last-mint-epoch))
      (current-index (var-get global-index-b))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* EMISSION_AMOUNT PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-b) EMISSION_AMOUNT))
    )
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
      (asserts! (> current-epoch last-mint) ERR_EMISSION_INTERVAL)
      (var-set total-distributed-b new-rewards)
      (var-set global-index-b new-index)
      (var-set last-mint-epoch current-epoch)
      (ok true)
    )
  )
)

(define-public (update-provide-rewards (user principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance user)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (map-get? user-rewards { account: user }))
    (old-balance (- balance amount))
  )
    (begin
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (if (is-some info)
        (let (
          (data (unwrap-panic info))
          (debt-a (get debt-a data))
          (debt-b (get debt-b data))
          (index-a (get index-a data))
          (index-b (get index-b data))
          (earned-a (/ (* old-balance (- global-a index-a)) PRECISION))
          (earned-b (/ (* old-balance (- global-b index-b)) PRECISION))
          (new-earned-a (/ (* balance (- global-a index-a)) PRECISION))
          (new-earned-b (/ (* balance (- global-b index-b)) PRECISION))
          (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
          (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
          (preserve-debt-a (if (> new-earned-a unclaimed-a) (- new-earned-a unclaimed-a) u0))
          (preserve-debt-b (if (> new-earned-b unclaimed-b) (- new-earned-b unclaimed-b) u0))
        )
          (map-set user-rewards { account: user } {
            balance: balance,
            block: block,
            debt-a: preserve-debt-a,
            debt-b: preserve-debt-b,
            index-a: index-a,
            index-b: index-b
          })
        )
        (map-set user-rewards { account: user } {
          balance: balance,
          block: block,
          debt-a: u0,
          debt-b: u0,
          index-a: global-a,
          index-b: global-b
        })
      )
      (ok true)
    )
  )
)

(define-public (update-remove-rewards (user principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance user)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (map-get? user-rewards { account: user }))
    (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (old-balance (+ balance amount))
    (other-lp (- total-lp old-balance))
  )
    (begin
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (let (
        (data (unwrap-panic info))
        (index-a (get index-a data))
        (index-b (get index-b data))
        (debt-a (get debt-a data))
        (debt-b (get debt-b data))
        (earned-a (/ (* old-balance (- global-a index-a)) PRECISION))
        (earned-b (/ (* old-balance (- global-b index-b)) PRECISION))
        (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
        (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
        (forfeit-a (/ (* unclaimed-a amount) old-balance))
        (forfeit-b (/ (* unclaimed-b amount) old-balance))
        (redistributed-a (if (> other-lp u0)
                      (/ (* forfeit-a PRECISION) other-lp)
                      u0))
        (redistributed-b (if (> other-lp u0)
                      (/ (* forfeit-b PRECISION) other-lp)
                      u0))
      )
        (begin
          (if (> forfeit-a u0)
            (begin
              (var-set global-index-a (+ global-a redistributed-a)))
            true)
          (if (> forfeit-b u0)
            (begin
              (var-set global-index-b (+ global-b redistributed-b)))
            true)
          (let (
            (new-global-a (var-get global-index-a))
            (new-global-b (var-get global-index-b))
            (preserve-a (- unclaimed-a forfeit-a))
            (preserve-b (- unclaimed-b forfeit-b))
            (preserve-idx-a (if (and (> balance u0) (> preserve-a u0))
                        (- new-global-a (/ (* preserve-a PRECISION) balance))
                        new-global-a))
            (preserve-idx-b (if (and (> balance u0) (> preserve-b u0))
                        (- new-global-b (/ (* preserve-b PRECISION) balance))
                        new-global-b))
          )
            (if (> balance u0)
              (map-set user-rewards
                { account: user }
                { balance: balance,
                  block: block,
                  debt-a: u0,
                  debt-b: u0,
                  index-a: preserve-idx-a,
                  index-b: preserve-idx-b
                })
              true)
          )
        )
      )
      (ok true)
    )
  )
)

(define-public (update-rewards-a (amount uint))
  (let (
      (current-index (var-get global-index-a))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-a) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .exchange) (is-eq contract-caller .rewards)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set total-distributed-a new-rewards)
      (var-set global-index-a new-index)
      (ok true)
    )
  )
)

(define-public (update-rewards-b (amount uint))
  (let (
      (current-index (var-get global-index-b))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-b) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .exchange) (is-eq contract-caller .rewards)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set total-distributed-b new-rewards)
      (var-set global-index-b new-index)
      (ok true)
    )
  )
)

;; controller functions
(define-public (update-transfer-recipient (recipient principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance recipient)))
    (block stacks-block-height)
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (info (map-get? user-rewards { account: recipient }))
  )
    (begin
      (asserts! (is-eq contract-caller .controller) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (if (is-some info)
        (let (
          (data (unwrap-panic info))
          (old-balance (- balance amount))
          (debt-a (get debt-a data))
          (debt-b (get debt-b data))
          (index-a (get index-a data))
          (index-b (get index-b data))
          (earned-a (/ (* old-balance (- current-global-a index-a)) PRECISION))
          (earned-b (/ (* old-balance (- current-global-b index-b)) PRECISION))
          (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
          (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
          (preserve-idx-a (if (> unclaimed-a u0)
                            (- current-global-a (/ (* unclaimed-a PRECISION) balance))
                            current-global-a))
          (preserve-idx-b (if (> unclaimed-b u0)
                            (- current-global-b (/ (* unclaimed-b PRECISION) balance))
                            current-global-b))
        )
          (begin
            (map-set user-rewards { account: recipient } {
              balance: balance,
              block: block,
              debt-a: u0,
              debt-b: u0,
              index-a: preserve-idx-a,
              index-b: preserve-idx-b
            })
            (ok true)
          )
        )
        (begin
          (map-set user-rewards { account: recipient } {
            balance: balance,
            block: block,
            debt-a: u0,
            debt-b: u0,
            index-a: current-global-a,
            index-b: current-global-b
          })
          (ok true)
        )
      )
    )
  )
)

(define-public (update-transfer-sender (sender principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance sender)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (unwrap! (map-get? user-rewards { account: sender }) ERR_NOT_AUTHORIZED))
    (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
    (old-balance (+ balance amount))
    (other-lp (- total-lp old-balance))
  )
    (begin
      (asserts! (is-eq contract-caller .controller) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (let (
        (index-a (get index-a info))
        (index-b (get index-b info))
        (debt-a (get debt-a info))
        (debt-b (get debt-b info))
        (earned-a (/ (* old-balance (- global-a index-a)) PRECISION))
        (earned-b (/ (* old-balance (- global-b index-b)) PRECISION))
        (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
        (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
        (forfeit-a (/ (* unclaimed-a amount) old-balance))
        (forfeit-b (/ (* unclaimed-b amount) old-balance))
        (redistributed-a (if (> other-lp u0)
                      (/ (* forfeit-a PRECISION) other-lp)
                      u0))
        (redistributed-b (if (> other-lp u0)
                      (/ (* forfeit-b PRECISION) other-lp)
                      u0))
      )
        (begin
          (if (> forfeit-a u0)
            (begin
              (var-set global-index-a (+ global-a redistributed-a)))
            true)
          (if (> forfeit-b u0)
            (begin
              (var-set global-index-b (+ global-b redistributed-b)))
            true)
          (map-delete user-rewards { account: sender })
          (let (
            (new-global-a (var-get global-index-a))
            (new-global-b (var-get global-index-b))
            (preserve-a (- unclaimed-a forfeit-a))
            (preserve-b (- unclaimed-b forfeit-b))
            (preserve-idx-a (if (and (> balance u0) (> preserve-a u0))
                        (- new-global-a (/ (* preserve-a PRECISION) balance))
                        new-global-a))
            (preserve-idx-b (if (and (> balance u0) (> preserve-b u0))
                        (- new-global-b (/ (* preserve-b PRECISION) balance))
                        new-global-b))
          )
            (if (> balance u0)
              (map-set user-rewards { account: sender } {
                balance: balance,
                block: block,
                debt-a: u0,
                debt-b: u0,
                index-a: preserve-idx-a,
                index-b: preserve-idx-b
              })
              true)
            (ok true)
          )
        )
      )
    )
  )
)

;; custom read only
(define-read-only (get-cleanup-rewards)
  (let (
    (actual-a (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)))
    (actual-b (unwrap-panic (contract-call? .street get-balance .rewards)))
    (claimed-a (var-get total-claimed-a))
    (claimed-b (var-get total-claimed-b))
    (distributed-a (var-get total-distributed-a))
    (distributed-b (var-get total-distributed-b))
    (dust-threshold u10000)
    (outstanding-a (- distributed-a claimed-a))
    (outstanding-b (- distributed-b claimed-b))
    (cleanup-a (if (> actual-a outstanding-a)
                    (- actual-a outstanding-a)
                    (if (and (is-eq actual-a outstanding-a)
                            (< outstanding-a dust-threshold))
                        actual-a
                        u0)))
    (cleanup-b (if (> actual-b outstanding-b)
                    (- actual-b outstanding-b)
                    (if (and (is-eq actual-b outstanding-b)
                            (< outstanding-b dust-threshold))
                        actual-b
                        u0)))
  )
    (ok {
      actual-a: actual-a,
      actual-b: actual-b,
      claimed-a: claimed-a,
      claimed-b: claimed-b,
      cleanup-a: cleanup-a,
      cleanup-b: cleanup-b,
      distributed-a: distributed-a,
      distributed-b: distributed-b,
      outstanding-a: outstanding-a,
      outstanding-b: outstanding-b
    })
  )
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-reward-pool-info)
    (ok {
      global-index-a: (var-get global-index-a),
      global-index-b: (var-get global-index-b),
      rewards-a: (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)),
      rewards-b: (unwrap-panic (contract-call? .street get-balance .rewards)),
    })
)

(define-read-only (get-reward-user-info (user principal))
  (let (
    (balance (unwrap-panic (contract-call? .credit get-balance user)))
    (info (default-to {
      balance: u0,
      block: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? user-rewards { account: user })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (debt-a (get debt-a info))
    (debt-b (get debt-b info))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance (- current-global-b user-index-b)) PRECISION))
    (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
    (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
  )
    (ok {
      balance: balance,
      block: (get block info),
      debt-a: debt-a,
      debt-b: debt-b,
      index-a: user-index-a,
      index-b: user-index-b,
      unclaimed-a: unclaimed-a,
      unclaimed-b: unclaimed-b
    })
  )
)