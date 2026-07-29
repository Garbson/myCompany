import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import FlowEmbedView from './FlowEmbedView.vue'

export const FlowEmbed = Node.create({
  name: 'flowEmbed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      flowchartId: {
        default: null,
        parseHTML: (el) => {
          const v = el.getAttribute('data-flowchart-id')
          return v ? Number(v) : null
        },
        renderHTML: (attrs) => ({ 'data-flowchart-id': attrs.flowchartId }),
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') || '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title || '' }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="flow-embed"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-type': 'flow-embed' }, HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(FlowEmbedView)
  },
})
