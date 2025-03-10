import type { ExecutionContext } from "../observation/observable.js";
import { emptyArray } from "../platform.js";
import {
    StatelessAttachedAttributeDirective,
    ViewBehaviorTargets,
} from "./html-directive.js";

/**
 * Options for configuring node observation behavior.
 * @public
 */
export interface NodeBehaviorOptions<T = any> {
    /**
     * The property to assign the observed nodes to.
     */
    property: T;

    /**
     * Filters nodes that are synced with the property.
     * Called one time for each element in the array.
     * @param value - The Node that is being inspected.
     * @param index - The index of the node within the array.
     * @param array - The Node array that is being filtered.
     */
    filter?: ElementsFilter;
}

/**
 * Elements filter function type.
 *
 * @public
 */
export type ElementsFilter = (value: Node, index: number, array: Node[]) => boolean;

const selectElements = (value: Node): boolean => value.nodeType === 1;

/**
 * Creates a function that can be used to filter a Node array, selecting only elements.
 * @param selector - An optional selector to restrict the filter to.
 * @public
 */
export const elements = (selector?: string): ElementsFilter =>
    selector
        ? value => value.nodeType === 1 && (value as HTMLElement).matches(selector)
        : selectElements;

/**
 * A base class for node observation.
 * @public
 * @remarks
 * Internally used by the SlottedDirective and the ChildrenDirective.
 */
export abstract class NodeObservationDirective<
    T extends NodeBehaviorOptions
> extends StatelessAttachedAttributeDirective<T> {
    private sourceProperty = `${this.id}-s`;

    /**
     * Bind this behavior to the source.
     * @param source - The source to bind to.
     * @param context - The execution context that the binding is operating within.
     * @param targets - The targets that behaviors in a view can attach to.
     */
    bind(source: any, context: ExecutionContext, targets: ViewBehaviorTargets): void {
        const target = targets[this.nodeId] as any;
        target[this.sourceProperty] = source;
        this.updateTarget(source, this.computeNodes(target));
        this.observe(target);
    }

    /**
     * Unbinds this behavior from the source.
     * @param source - The source to unbind from.
     * @param context - The execution context that the binding is operating within.
     * @param targets - The targets that behaviors in a view can attach to.
     */
    unbind(source: any, context: ExecutionContext, targets: ViewBehaviorTargets): void {
        const target = targets[this.nodeId] as any;
        this.updateTarget(source, emptyArray);
        this.disconnect(target);
        target[this.sourceProperty] = null;
    }

    /**
     * Gets the data source for the target.
     * @param target - The target to get the source for.
     * @returns The source.
     */
    protected getSource(target: Node) {
        return target[this.sourceProperty];
    }

    /**
     * Updates the source property with the computed nodes.
     * @param source - The source object to assign the nodes property to.
     * @param value - The nodes to assign to the source object property.
     */
    protected updateTarget(source: any, value: ReadonlyArray<any>): void {
        source[this.options.property] = value;
    }

    /**
     * Computes the set of nodes that should be assigned to the source property.
     * @param target - The target to compute the nodes for.
     * @returns The computed nodes.
     * @remarks
     * Applies filters if provided.
     */
    protected computeNodes(target: any): Node[] {
        let nodes = this.getNodes(target);

        if ("filter" in this.options) {
            nodes = nodes.filter(this.options.filter!);
        }

        return nodes;
    }

    /**
     * Begins observation of the nodes.
     * @param target - The target to observe.
     */
    protected abstract observe(target: any): void;

    /**
     * Disconnects observation of the nodes.
     * @param target - The target to unobserve.
     */
    protected abstract disconnect(target: any): void;

    /**
     * Retrieves the raw nodes that should be assigned to the source property.
     * @param target - The target to get the node to.
     */
    protected abstract getNodes(target: any): Node[];
}
