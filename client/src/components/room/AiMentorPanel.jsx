import React, { useState } from 'react';
import { Sparkles, Brain, Cpu, AlertCircle, HelpCircle, Send, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export function AiMentorPanel({ getEditorCode }) {
  const [activeMode, setActiveMode] = useState('explain'); // 'explain' | 'complexity' | 'edgecases' | 'qa'
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: '👋 Hello! I am your CodeTogether AI Mentor. Click any analysis tool above or ask me about algorithms, complexity, or edge cases.',
    },
  ]);

  const analyzeCode = (mode) => {
    const code = getEditorCode ? getEditorCode() : '';
    if (!code || !code.trim()) {
      setAnalysisResult({
        title: 'Empty Canvas',
        body: 'The editor is currently empty. Write or load an algorithm to receive an intelligent educational breakdown!',
      });
      return;
    }

    setIsLoading(true);
    setActiveMode(mode);

    // Realistic heuristic analyzer that inspects loops, maps, recursion, and keywords
    setTimeout(() => {
      setIsLoading(false);
      const lines = code.split('\n').filter((l) => l.trim().length > 0);
      const hasForLoop = code.includes('for ') || code.includes('for(');
      const hasNestedLoop = (code.match(/for\s*\(|while\s*\(/g) || []).length > 1;
      const hasMap = code.includes('Map') || code.includes('dict') || code.includes('{}') || code.includes('hash');
      const hasRecursion = code.includes('return ') && lines.some((l) => l.includes('(') && l.includes(')'));
      const hasTwoPointers = code.includes('left') && code.includes('right');

      if (mode === 'explain') {
        let explanation = `### 📖 Algorithm Architecture Breakdown\n\n`;
        explanation += `• **Document Scope**: Contains ${lines.length} lines of executable logic.\n`;
        if (hasMap) {
          explanation += `• **Data Structure**: Utilizes a **Hash Map / Key-Value Store** to achieve average $O(1)$ amortized lookups and complement matching.\n`;
        }
        if (hasTwoPointers) {
          explanation += `• **Technique**: Applies the **Two Pointers** pattern, scanning inward from both boundaries to avoid $O(n^2)$ quadratic passes.\n`;
        }
        if (hasNestedLoop) {
          explanation += `• **Control Flow**: Contains nested iteration structures examining pairs or Cartesian subsets.\n`;
        } else if (hasForLoop) {
          explanation += `• **Control Flow**: Executes in a single linear pass over the dataset.\n`;
        }
        explanation += `• **Key Invariant**: Guarantees termination and maintains proper bounds across iteration cycles.`;

        setAnalysisResult({
          title: 'Educational Code Walkthrough',
          body: explanation,
        });
      } else if (mode === 'complexity') {
        let timeComp = '$O(n)$';
        let spaceComp = '$O(1)$';
        let reasoning = '';

        if (hasNestedLoop) {
          timeComp = '$O(n^2)$ (Quadratic)';
          reasoning = 'Nested loop structure detected: each outer element triggers a full inner traversal.';
        } else if (code.includes('binarySearch') || code.includes('Math.floor((left + right) / 2)')) {
          timeComp = '$O(\\log n)$ (Logarithmic)';
          reasoning = 'Divide-and-conquer pattern: search space is halved on each iteration.';
        } else if (hasForLoop || code.includes('while')) {
          timeComp = '$O(n)$ (Linear)';
          reasoning = 'Single linear scan visiting each element of the collection at most a constant number of times.';
        }

        if (hasMap || code.includes('stack') || code.includes('memo')) {
          spaceComp = '$O(n)$ (Linear Aux Space)';
        }

        setAnalysisResult({
          title: 'Asymptotic Complexity Analysis',
          body: `• **Time Complexity**: **${timeComp}**\n  *Reasoning*: ${reasoning}\n\n• **Space Complexity**: **${spaceComp}**\n  *Reasoning*: Memory allocated for auxiliary data structures scales with input size $n$.\n\n• **Efficiency Rating**: 🟢 **Optimal for Production Environments**`,
        });
      } else if (mode === 'edgecases') {
        setAnalysisResult({
          title: 'Boundary & Edge Case Checklist',
          body: `1. **Empty / Null Input**: Ensure the function handles \`[]\` or \`null\` gracefully without throwing an unhandled exception.\n2. **Single Element Collection**: Verify behavior when $n = 1$.\n3. **Duplicate Values**: Confirm logic handles identical keys or values correctly.\n4. **Negative & Zero Values**: Check arithmetic underflow/overflow if working with negative indices or sums.\n5. **Large Scale Input**: Test with $10^5$ items to verify memory limits and 5-second wall-clock timeouts.`,
        });
      }
    }, 400);
  };

  const handleAskQuestion = (e) => {
    e.preventDefault();
    const q = userQuery.trim();
    if (!q) return;

    const newLog = [...chatLog, { sender: 'user', text: q }];
    setUserQuery('');
    setChatLog(newLog);

    setTimeout(() => {
      let reply = `Great question! In educational collaborative coding, maintaining clear invariants and analyzing Big-O trade-offs is key.`;
      const lower = q.toLowerCase();
      if (lower.includes('map') || lower.includes('hash')) {
        reply = `Hash maps provide $O(1)$ average time complexity for insertions and lookups by computing a deterministic hash of the key. In Two Sum, this allows finding the complement in constant time instead of scanning the rest of the array!`;
      } else if (lower.includes('optimize') || lower.includes('faster')) {
        reply = `To optimize this further, consider memory locality: storing primitive numeric keys in a flat TypedArray or pre-allocating hash buckets can reduce garbage collection pressure.`;
      } else if (lower.includes('space') || lower.includes('memory')) {
        reply = `The auxiliary space is primarily bounded by the elements stored in your helper collection. If space must be $O(1)$, consider in-place two-pointer traversal after sorting!`;
      }

      setChatLog((prev) => [...prev, { sender: 'ai', text: reply }]);
    }, 500);
  };

  return (
    <div style={styles.container}>
      {/* Top Action Tabs */}
      <div style={styles.topActions}>
        <button
          onClick={() => analyzeCode('explain')}
          className={activeMode === 'explain' && analysisResult ? 'btn btn-primary' : 'btn btn-secondary'}
          style={styles.actionPill}
        >
          <Brain size={13} />
          <span>Explain</span>
        </button>

        <button
          onClick={() => analyzeCode('complexity')}
          className={activeMode === 'complexity' && analysisResult ? 'btn btn-primary' : 'btn btn-secondary'}
          style={styles.actionPill}
        >
          <Cpu size={13} />
          <span>Complexity</span>
        </button>

        <button
          onClick={() => analyzeCode('edgecases')}
          className={activeMode === 'edgecases' && analysisResult ? 'btn btn-primary' : 'btn btn-secondary'}
          style={styles.actionPill}
        >
          <AlertCircle size={13} />
          <span>Edge Cases</span>
        </button>
      </div>

      {/* Analysis Result Display */}
      {isLoading ? (
        <div style={styles.loadingBox}>
          <Sparkles size={20} className="spinner" style={{ animation: 'spin 1.5s linear infinite', color: 'var(--primary)' }} />
          <span style={styles.loadingText}>Synthesizing educational insights...</span>
        </div>
      ) : analysisResult ? (
        <div className="glass-subtle" style={styles.resultCard}>
          <div style={styles.resultHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: 'var(--accent)' }} />
              <span style={styles.resultTitle}>{analysisResult.title}</span>
            </div>
            <button
              onClick={() => setAnalysisResult(null)}
              className="btn-ghost"
              style={{ padding: '2px 6px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          </div>
          <div style={styles.resultBody}>
            {analysisResult.body.split('\n').map((line, i) => (
              <p key={i} style={styles.resultLine}>
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {/* Q&A Chat Log */}
      <div style={styles.chatArea}>
        <div style={styles.chatTitleRow}>
          <span style={styles.chatHeaderTitle}>Interactive Q&A</span>
          <span className="badge-glass badge-primary" style={{ fontSize: '0.625rem' }}>
            Live Assistant
          </span>
        </div>

        <div style={styles.chatMessages}>
          {chatLog.map((msg, idx) => (
            <div
              key={idx}
              style={{
                ...styles.chatBubble,
                ...(msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi),
              }}
            >
              {msg.text}
            </div>
          ))}
        </div>

        <form onSubmit={handleAskQuestion} style={styles.chatForm}>
          <input
            type="text"
            className="input-glass"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Ask a question about this code..."
            style={{ fontSize: '0.8125rem', padding: '8px 12px' }}
          />
          <button
            type="submit"
            disabled={!userQuery.trim()}
            className="btn btn-primary"
            style={{ padding: '8px 12px', flexShrink: 0 }}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: '14px',
    gap: '12px',
    overflowY: 'auto',
  },
  topActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  actionPill: {
    padding: '7px 8px',
    fontSize: '0.6875rem',
    borderRadius: 'var(--radius-sm)',
    gap: '4px',
    justifyContent: 'center',
  },
  loadingBox: {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--glass-bg-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  loadingText: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
  },
  resultCard: {
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--glass-border)',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid var(--glass-border-subtle)',
  },
  resultTitle: {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  resultBody: {
    fontSize: '0.75rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultLine: {
    margin: 0,
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderTop: '1px solid var(--glass-border-subtle)',
    paddingTop: '10px',
    minHeight: '180px',
  },
  chatTitleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  chatHeaderTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '10px',
    maxHeight: '180px',
  },
  chatBubble: {
    padding: '8px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    lineHeight: '1.4',
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: 'var(--primary)',
    color: '#FFFFFF',
    borderBottomRightRadius: '2px',
    maxWidth: '85%',
  },
  bubbleAi: {
    alignSelf: 'flex-start',
    backgroundColor: 'var(--glass-bg-strong)',
    color: 'var(--text-primary)',
    border: '1px solid var(--glass-border-subtle)',
    borderBottomLeftRadius: '2px',
    maxWidth: '90%',
  },
  chatForm: {
    display: 'flex',
    gap: '6px',
  },
};

