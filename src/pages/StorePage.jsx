import { useState } from "react"

import StoreHero from "../components/storePage/StoreHero"
import CategorySidebar from "../components/storePage/CategorySidebar"
import ProductCard from "../components/storePage/ProductCard"
import MiniCart from "../components/storePage/MiniCart"
import Toast from "../components/storePage/Toast"

/*
 * Imágenes temporales.
 *
 * Actualmente se utiliza el logo de DeliveryGo como reemplazo
 * hasta disponer de las imágenes definitivas de cada producto
 * y del comercio.
 *
 * Reemplazar posteriormente por:
 *
 * import bannerImage from "../assets/store-banner.png"
 * import storeLogo from "../assets/la-birra-logo.png"
 * import goldenBurgerImage from "../assets/golden-burger.png"
 * import royaleBurgerImage from "../assets/royale-burger.png"
 * import truffleBurgerImage from "../assets/truffle-burger.png"
 * import papasImage from "../assets/papas-cheddar.png"
 * import limonadaImage from "../assets/limonada.png"
 */
import bannerImage from "../assets/deliverygo_logo.png"
import storeLogo from "../assets/deliverygo_logo.png"
import goldenBurgerImage from "../assets/deliverygo_logo.png"
import royaleBurgerImage from "../assets/deliverygo_logo.png"
import truffleBurgerImage from "../assets/deliverygo_logo.png"
import papasImage from "../assets/deliverygo_logo.png"
import limonadaImage from "../assets/deliverygo_logo.png"

/*
 * Catálogo de productos disponibles en el comercio.
 *
 * Cada producto contiene:
 * - id: identificador único.
 * - category: categoría a la cual pertenece.
 * - name: nombre visible.
 * - description: descripción del producto.
 * - price: precio numérico.
 * - image: imagen asociada.
 *
 * Algunos productos también pueden incluir:
 * - badge: etiqueta destacada.
 * - badgeIcon: ícono de la etiqueta.
 * - badgeColor: color visual de la etiqueta.
 * - available: indica si tiene stock.
 */
const products = [
  {
    id: 1,
    category: "hamburguesas-dobles",
    name: "Golden Burger Doble",
    description:
      "Doble medallón de carne smash de 120g, queso cheddar americano x4, bacon crocante y salsa Thousand Island en pan brioche de papa.",
    price: 7800,
    image: goldenBurgerImage,
    badge: "Más pedida",
    badgeIcon: "workspace_premium",
    badgeColor: "text-amber-600",
  },
  {
    id: 2,
    category: "hamburguesas-dobles",
    name: "Royale Burger",
    description:
      "Medallón de carne novillo, cebolla caramelizada lentamente, queso brie fundido, rúcula fresca seleccionada y mayonesa ahumada artesanal.",
    price: 8200,
    image: royaleBurgerImage,
  },
  {
    id: 3,
    category: "hamburguesas-dobles",
    name: "Truffle Bacon Smash",
    description:
      "Doble smash con mayonesa emulsionada de trufas negras europeas, panceta ahumada crujiente y cebolla morada grillada.",
    price: 8900,
    image: truffleBurgerImage,
    available: false,
  },
  {
    id: 4,
    category: "guarniciones-papas",
    name: "Papas con Cheddar y Panceta",
    description:
      "Papas bastón rústicas doble cocción, cheddar fundido de la casa, lluvia de panceta crocante y ciboulette finamente picado.",
    price: 3900,
    image: papasImage,
  },
  {
    id: 5,
    category: "bebidas-cervezas",
    name: "Limonada con Menta y Jengibre 500ml",
    description:
      "Fresca exprimida en el momento con jugo de limones tucumanos, hojas frescas de menta orgánica y un toque de jengibre.",
    price: 2100,
    image: limonadaImage,
    badge: "100% Natural",
    badgeIcon: "eco",
  },
]

/**
 * Página principal de detalle de un comercio.
 *
 * Permite:
 * - Visualizar la información del comercio.
 * - Marcarlo como favorito.
 * - Compartir el comercio.
 * - Navegar entre categorías.
 * - Agregar productos al carrito.
 * - Incrementar o disminuir cantidades.
 * - Visualizar subtotales y total del pedido.
 * - Mostrar mensajes temporales mediante Toast.
 */
function StorePage() {

  /*
   * Indica si el comercio está marcado
   * actualmente como favorito.
   */
  const [favorite, setFavorite] = useState(true)

  /*
   * Estado principal del carrito.
   *
   * Cada elemento contiene:
   * - id
   * - name
   * - price
   * - quantity
   */
  const [cart, setCart] = useState([
    {
      id: 1,
      name: "Golden Burger Doble",
      price: 7800,
      quantity: 1,
    },
    {
      id: 4,
      name: "Papas con Cheddar y Panceta",
      price: 3900,
      quantity: 1,
    },
  ])

  /*
   * Mensaje temporal utilizado por el componente Toast.
   *
   * Si contiene una cadena vacía, el Toast no se muestra.
   */
  const [toast, setToast] = useState("")

  /**
   * Agrega un producto al carrito.
   *
   * Si el producto ya existe, aumenta su cantidad.
   * Si todavía no existe, lo agrega con cantidad 1.
   */
  function addToCart(product) {

    setCart((currentCart) => {

      const existingItem = currentCart.find(
        (item) => item.id === product.id
      )

      if (existingItem) {

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    })

    /*
     * Informa visualmente que el producto
     * fue agregado correctamente.
     */
    setToast(`${product.name} agregado al carrito`)

    setTimeout(() => {
      setToast("")
    }, 2200)
  }

  /**
   * Incrementa en una unidad la cantidad de
   * un producto existente en el carrito.
   */
  function increaseQuantity(id) {

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      )
    )
  }

  /**
   * Disminuye en una unidad la cantidad de
   * un producto del carrito.
   *
   * Cuando la cantidad llega a 0,
   * el producto se elimina del carrito.
   */
  function decreaseQuantity(id) {

    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  /*
   * Productos filtrados por categoría.
   *
   * Estos arreglos se utilizan posteriormente
   * para renderizar las diferentes secciones.
   */
  const burgerProducts = products.filter(
    (product) =>
      product.category === "hamburguesas-dobles"
  )

  const sideProducts = products.filter(
    (product) =>
      product.category === "guarniciones-papas"
  )

  const drinkProducts = products.filter(
    (product) =>
      product.category === "bebidas-cervezas"
  )

  /*
   * Cantidad total de unidades presentes
   * actualmente en el carrito.
   */
  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  )

  /*
   * Suma del precio de todos los productos
   * teniendo en cuenta sus cantidades.
   */
  const subtotal = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  )

  /*
   * El costo de envío se agrega únicamente
   * cuando existe al menos un producto.
   */
  const total =
    subtotal + (cart.length > 0 ? 850 : 0)

  return (
    <main id="top" className="w-full pt-20 bg-background min-h-[calc(100vh-280px)]">

      <div className="flex flex-col w-full">

        {/* Información principal del comercio */}
        <StoreHero
          bannerImage={bannerImage}
          logoImage={storeLogo}
          favorite={favorite}
          onToggleFavorite={() => setFavorite((current) => !current)}
        />

        {/* Área principal del catálogo */}
        <div className="max-w-[1280px] mx-auto w-full px-gutter-mobile lg:px-gutter-desktop py-space-xl">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

            {/* Navegación de categorías para escritorio */}
            <CategorySidebar />

            {/*Catalogo */}
            <section className="col-span-1 lg:col-span-6 space-y-space-xl">

              {/* Navegación horizontal visible en dispositivos móviles */}
              <div className="lg:hidden flex items-center gap-space-xs overflow-x-auto pb-space-xs pr-8">

                <a
                  href="#hamburguesas-dobles"
                  className="px-space-md py-1.5 rounded-full bg-primary-container text-on-primary font-caption-bold text-caption-bold shrink-0 shadow-sm"
                >
                  Hamburguesas
                </a>

                <a
                  href="#guarniciones-papas"
                  className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant font-caption-bold text-caption-bold shrink-0 shadow-sm"
                >
                  Papas & Extras
                </a>

                <a
                  href="#bebidas-cervezas"
                  className="px-space-md py-1.5 rounded-full bg-surface-container-lowest text-on-surface-variant font-caption-bold text-caption-bold shrink-0 shadow-sm"
                >
                  Bebidas
                </a>
              </div>

              {/* Sección de hamburguesas */}
              <ProductSection
                id="hamburguesas-dobles"
                title="Hamburguesas Dobles & Triples"
                description="Carne fresca smash 100% novillo"
                products={burgerProducts}
                onAdd={addToCart}
              />

              {/* Sección de guarniciones */}
              <ProductSection
                id="guarniciones-papas"
                title="Guarniciones & Papas"
                description="Papas naturales doble cocción"
                products={sideProducts}
                onAdd={addToCart}
              />

              {/* Sección de bebidas */}
              <ProductSection
                id="bebidas-cervezas"
                title="Bebidas & Cervezas"
                description="Bebidas frías y coctelería sin alcohol"
                products={drinkProducts}
                onAdd={addToCart}
              />
            </section>

            {/* Carrito lateral */}
            <MiniCart
              cart={cart}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
            />
          </div>
        </div>

        {/* Carrito para MOBILE */}
        {cart.length > 0 && (

          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest p-space-md shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">

            <div className="flex items-center justify-between gap-space-md max-w-[1280px] mx-auto">

              {/* Resumen del carrito */}
              <div className="flex flex-col">

                <span className="font-caption-sm text-caption-sm text-secondary">
                  {cartCount} productos seleccionados
                </span>

                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  $ {total.toLocaleString("es-AR")}
                </span>
              </div>

              {/* Checkout */}
              <a
                href="#top"
                className="h-12 px-space-lg bg-primary-container hover:bg-primary text-on-primary rounded-xl font-body-lg-medium text-body-lg-medium flex items-center justify-center gap-2 shadow-md flex-1"
              >

                <span>
                  Ir a pagar
                </span>

                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </a>
            </div>
          </div>

        )}
      </div>

      {/* Mensaje temporal de confirmación */}
      <Toast message={toast} />
    </main>
  )
}

/**
 * Sección reutilizable del catálogo.
 *
 * Props:
 * @param {string} id
 * Identificador utilizado para navegación mediante anclas.
 *
 * @param {string} title
 * Nombre visible de la categoría.
 *
 * @param {string} description
 * Descripción breve de la categoría.
 *
 * @param {Array} products
 * Productos pertenecientes a la categoría.
 *
 * @param {Function} onAdd
 * Función ejecutada cuando se agrega un producto.
 */
function ProductSection({ id, title, description, products, onAdd }) {

  return (
    <div
      id={id}
      className="space-y-space-md scroll-mt-24"
    >

      {/* Encabezado de la categoría */}
      <div className="flex items-baseline justify-between">

        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
          {title}
        </h2>

        <span className="font-caption-sm text-caption-sm text-secondary hidden sm:inline">
          {description}
        </span>
      </div>

      {/* Generación dinámica de las tarjetas de producto */}
      {products.map((product) => (

        <ProductCard
          key={product.id}
          product={product}
          onAdd={onAdd}
        />
      ))}
    </div>
  )
}

export default StorePage