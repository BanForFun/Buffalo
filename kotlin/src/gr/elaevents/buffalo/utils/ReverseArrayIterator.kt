package gr.elaevents.buffalo.utils

class ReverseArrayIterator<T>(private val array: Array<T>) : Iterator<T> {
    private var index = array.size - 1

    override fun hasNext(): Boolean = index >= 0

    override fun next(): T {
        if (!hasNext()) throw NoSuchElementException()
        return array[index--]
    }
}