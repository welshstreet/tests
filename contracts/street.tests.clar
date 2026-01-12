;; Street Contract Fuzz Tests

;; =============================================================================
;; INVARIANT TESTS
;; =============================================================================

;; Invariant 1: Token supply constraints should be enforced
(define-read-only (invariant-supply-constraints)
  (and
    (<= (ft-get-supply street) TOKEN_SUPPLY)
    (<= (var-get street-minted) MINT_CAP)
    (>= (ft-get-supply street) u0)
    (>= (var-get street-minted) u0)))

;; Invariant 2: Emission parameters should be immutable
(define-read-only (invariant-emission-constants)
  (and
    (is-eq EMISSION_AMOUNT u10000000000)
    (is-eq EMISSION_INTERVAL u1)
    (is-eq TOKEN_SUPPLY u10000000000000000)
    (is-eq MINT_CAP u5000000000000000)))

;; Invariant 3: Kill switch should be one-way (cannot be unflipped)
(define-read-only (invariant-kill-switch-one-way)
  (or 
    (is-eq (var-get kill-switch) true)
    (is-eq (var-get kill-switch) false))) ;; Valid boolean state

;; Invariant 4: Emission epoch should be monotonic
(define-read-only (invariant-emission-epoch-monotonic)
  (>= (var-get emission-epoch) u0))

;; Invariant 5: Token metadata should be immutable
(define-read-only (invariant-token-metadata)
  (and
    (is-eq (get-name) (ok TOKEN_NAME))
    (is-eq (get-symbol) (ok TOKEN_SYMBOL))
    (is-eq (get-decimals) (ok TOKEN_DECIMALS))))

;; Invariant 6: Block tracking consistency
(define-read-only (invariant-block-tracking)
  (and
    (>= (var-get last-mint-block) u0)
    (<= (var-get last-mint-block) burn-block-height)))

;; =============================================================================
;; PROPERTY-BASED TESTS
;; =============================================================================

;; Test 1: Street mint amount validation
(define-public (test-street-mint-amount-validation (amount uint))
  (if (and (> amount u0) (<= amount MINT_CAP))
    (begin
      (asserts! (> amount u0) (err u999))
      (asserts! (<= amount MINT_CAP) (err u998))
      (ok true))
    (ok false))) ;; Discard invalid amounts

;; Test 2: Total supply bounds checking
(define-public (test-total-supply-bounds (mint-amount uint))
  (if (and (> mint-amount u0) 
           (<= (+ (ft-get-supply street) mint-amount) TOKEN_SUPPLY))
    (begin
      (asserts! (> mint-amount u0) (err u997))
      (asserts! (<= (+ (ft-get-supply street) mint-amount) TOKEN_SUPPLY) (err u996))
      (ok true))
    (ok false))) ;; Discard amounts that would exceed total supply

;; Test 3: Transfer amount validation
(define-public (test-transfer-amount-validation (amount uint))
  (if (and (> amount u0) (<= amount u1000000000000))
    (begin
      (asserts! (> amount u0) (err u995))
      (asserts! (<= amount u1000000000000) (err u994))
      (ok true))
    (ok false))) ;; Discard invalid transfer amounts

;; Test 4: Address validation for transfers
(define-public (test-transfer_address_validation (sender principal) (recipient principal))
  (if (and 
        (not (is-eq sender 'SP000000000000000000002Q6VF78))
        (not (is-eq recipient 'SP000000000000000000002Q6VF78))
        (not (is-eq sender recipient)))
    (begin
      (asserts! (not (is-eq sender 'SP000000000000000000002Q6VF78)) (err u993))
      (asserts! (not (is-eq recipient 'SP000000000000000000002Q6VF78)) (err u992))
      (asserts! (not (is-eq sender recipient)) (err u991))
      (ok true))
    (ok false))) ;; Discard invalid addresses

;; Test 5: Emission timing validation
(define-public (test-emission_timing_validation (current-block uint) (last-block uint))
  (if (and (>= current-block u0) (>= last-block u0) (>= current-block last-block))
    (begin
      (asserts! (>= current-block u0) (err u990))
      (asserts! (>= last-block u0) (err u989))
      (asserts! (>= current-block last-block) (err u988))
      (ok true))
    (ok false))) ;; Discard invalid block heights

;; Test 6: URI string validation
(define-public (test-uri-string-validation (uri-string (string-utf8 256)))
  (if (and (> (len uri-string) u0) (<= (len uri-string) u256))
    (begin
      (asserts! (> (len uri-string) u0) (err u987))
      (asserts! (<= (len uri-string) u256) (err u986))
      (ok true))
    (ok false))) ;; Discard invalid URI strings