package gr.elaevents.buffalo.utils

class EmptyIterator<T> : Iterator<T> {
    override fun hasNext(): Boolean = false
    override fun next(): T = throw NoSuchElementException()
}
