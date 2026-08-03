(function () {
  const KEY           = 'jt_panier';
  const SHIPPING_COST = 300;   // 3,00 €
  const SHIPPING_FREE = 4500;  // 45,00 € — seuil franchise sur produits physiques

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
    //          gelato_product_id, variante_id, personnalisation }
    add(item) {
      const cart = this.get();
      const key  = this._k(item);
      const ex   = cart.find(i => this._k(i) === key);
      if (ex) ex.quantity = (ex.quantity || 1) + 1;
      else cart.push({ ...item, quantity: 1 });
      this._save(cart);
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

    // La livraison ne s'applique que sur les produits physiques
    _physicalSubtotal() {
      return this.get()
        .filter(i => i.type_produit === 'physique')
        .reduce((s, i) => s + (i.price_cents || 0) * (i.quantity || 1), 0);
    },

    shipping() {
      const hasPhysical = this.get().some(i => i.type_produit === 'physique');
      if (!hasPhysical) return 0;
      return this._physicalSubtotal() >= SHIPPING_FREE ? 0 : SHIPPING_COST;
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
