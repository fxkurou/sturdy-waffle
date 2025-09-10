import styles from "../page.module.css";
import CatalogButton from './CatalogButton'; // Import the client component

export default function CatalogPage() {
    return (
        <div className={styles.page}>
            <h1>Catalog Page</h1>
            <CatalogButton />
        </div>
    );
}