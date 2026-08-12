(function () {
  const KEY             = 'jt_panier';
  const SHIPPING_LETTRE = 200;   // 2,00 € — petits objets (marque-pages, cartes)
  const SHIPPING_COLIS  = 490;   // 4,90 € — colis (mugs, grands formats)
  const SHIPPING_FREE   = 4900;  // 49,00 € — livraison offerte sur produits manuels

  window.Cart = {
    get() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; }
      catch { return []; }
    },

    // Clé unique par article (produit + variante)
    _k(item) { return item.produit_id + '|' + (item.variante_id || ''); },

    _save(items) {
      localStorage.setItem(KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('jt-cart-updated'));
    },

    // item = { produit_id, slug, title, preview_url, price_cents,
    //          type_produit ('numerique'|'physique'),
    //          gelato_product_id, mode_livraison ('lettre'|'colis'),
    //          variante_id, personnalisation }
    add(item) {
      const cart = this.get();
      const key  = this._k(item);
      const ex   = cart.find(i => this._k(i) === key);
      if (ex) ex.quantity = (ex.quantity || 1) + 1;
      else cart.push({ ...item, quantity: 1 });
      this._save(cart);
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          currency: 'EUR',
          value: (item.price_cents || 0) / 100,
          items: [{
            item_id: item.produit_id,
            item_name: item.title,
            item_category: item.category || '',
            price: (item.price_cents || 0) / 100,
            quantity: 1,
          }],
        },
      });
    },

    remove(key) {
      this._save(this.get().filter(i => this._k(i) !== key));
    },

    setQty(key, qty) {
      if (qty <= 0) { this.remove(key); return; }
      const cart = this.get();
      const item = cart.find(i => this._k(i) === key);
      if (item) { item.quantity = qty; this._save(cart); }
    },

    clear() { this._save([]); },

    count() {
      return this.get().reduce((s, i) => s + (i.quantity || 1), 0);
    },

    subtotal() {
      return this.get().reduce((s, i) => s + (i.price_cents || 0) * (i.quantity || 1), 0);
    },

    // Produits physiques et bundles NON-Gelato (Gelato gère sa propre livraison)
    _manualPhysical() {
      return this.get().filter(i =>
        (i.type_produit === 'physique' && !i.gelato_product_id) ||
        (i.type_produit === 'bundle' && !i.gelato_product_id)
      );
    },

    _manualSubtotal() {
      return this._manualPhysical().reduce((s, i) => s + (i.price_cents || 0) * (i.quantity || 1), 0);
    },

    shipping() {
      const manual = this._manualPhysical();
      if (!manual.length) return 0;
      if (this._manualSubtotal() >= SHIPPING_FREE) return 0;
      // Si au moins un article nécessite un colis → tarif colis
      const hasColis = manual.some(i => !i.mode_livraison || i.mode_livraison === 'colis');
      return hasColis ? SHIPPING_COLIS : SHIPPING_LETTRE;
    },

    total() { return this.subtotal() + this.shipping(); },

    updateBadge() {
      const n = this.count();
      document.querySelectorAll('.jt-cart-count').forEach(el => {
        el.textContent = n;
        el.style.display = n > 0 ? 'flex' : 'none';
      });
    },
  };

  window.addEventListener('jt-cart-updated', () => Cart.updateBadge());
  document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
})();
