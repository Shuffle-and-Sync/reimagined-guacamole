# TableSync E2E Test Scenarios

## Overview

This document outlines comprehensive end-to-end test scenarios for the TableSync Spelltable parity features.

---

## Test Scenarios

### Scenario 1: Complete MTG Commander Game Session

**Objective**: Verify all features work together in a realistic Commander game.

**Prerequisites**:

- 4 test users
- 4 different browsers/devices
- Stable internet connection
- Magic: The Gathering cards available

**Steps**:

1. **Initial Setup** (2 minutes)
   - [ ] User 1 navigates to `/video-room`
   - [ ] User 1 generates room ID: `mtg-commander-test-001`
   - [ ] User 1 clicks "Join Room"
   - [ ] User 1 grants camera/microphone permissions
   - [ ] User 1 sees their video feed

2. **Multi-Player Join** (3 minutes)
   - [ ] Users 2, 3, 4 navigate to `/video-room/mtg-commander-test-001`
   - [ ] Each user grants permissions
   - [ ] All users see 4 video feeds in grid layout
   - [ ] All video feeds show active camera
   - [ ] Audio is working (verified by speaking)

3. **Connection Verification** (1 minute)
   - [ ] All users show "Connected" status
   - [ ] Video latency < 500ms (verified by waving)
   - [ ] No dropped frames or freezing

4. **Game State Setup** (2 minutes)
   - [ ] User 1 clicks "Game: OFF" button to toggle to "Game: ON"
   - [ ] Game state overlay appears on right side for all users
   - [ ] All players show 40 starting life (Commander format)
   - [ ] Turn indicator shows User 1 as active player
   - [ ] Turn number shows "Turn 1"

5. **Life Counter Operations** (5 minutes)
   - [ ] User 1 clicks "-1" button → life goes to 39
   - [ ] All users see User 1's life update to 39
   - [ ] User 1 clicks "+5" button → life goes to 44
   - [ ] User 2 takes 3 damage → life goes to 37
   - [ ] All users see synchronized life totals
   - [ ] User 3 takes 15 damage → life goes to 25 (yellow warning)
   - [ ] User 4 takes 35 damage → life goes to 5 (orange danger)

6. **Turn Management** (3 minutes)
   - [ ] User 1 clicks "Pass Turn"
   - [ ] Turn indicator moves to User 2 (blue ring)
   - [ ] Turn number increments to 2
   - [ ] "Pass Turn" button disabled for Users 1, 3, 4
   - [ ] "Pass Turn" button enabled only for User 2
   - [ ] User 2 passes turn → moves to User 3
   - [ ] Continue cycle back to User 1 (turn 5)

7. **Commander Damage Tracking** (5 minutes)
   - [ ] User 2 deals commander damage to User 1
   - [ ] Commander damage section appears for User 1
   - [ ] Click "+5" on User 2's commander → 5 damage recorded
   - [ ] User 2 deals additional 10 commander damage
   - [ ] Total shows 15 commander damage from User 2
   - [ ] User 3 deals 21 commander damage to User 4
   - [ ] "LETHAL!" warning appears in red
   - [ ] All users see commander damage updates

8. **Counter Management** (3 minutes)
   - [ ] User 1 receives poison counters
   - [ ] Click "+3" on poison → 3 counters shown
   - [ ] Add 4 more poison counters → 7 total (yellow warning)
   - [ ] Add 3 more → 10 total (red "LETHAL!" warning)
   - [ ] User 2 gains energy counters → Add 5 energy
   - [ ] All counters sync across all users

9. **Card Recognition** (10 minutes)
   - [ ] User 1 toggles "Card ID" mode ON
   - [ ] "Click on a card to identify it" overlay appears
   - [ ] User 1 holds up "Lightning Bolt" to camera
   - [ ] User 2 clicks on the card in User 1's video feed
   - [ ] Blue ping animation shows click location
   - [ ] "Recognizing card..." indicator appears
   - [ ] Card preview modal opens (2-3 seconds)
   - [ ] Modal shows "Lightning Bolt" details
   - [ ] Confidence badge shows green (>70%)
   - [ ] User 2 clicks "View on Scryfall" link
   - [ ] New tab opens with correct Scryfall page
   - [ ] Close modal
   - [ ] User 3 holds up "Sol Ring"
   - [ ] User 4 recognizes it → Correct identification
   - [ ] Try with foil card → Lower confidence expected
   - [ ] Alternative matches shown if confidence < 70%

10. **Media Controls** (3 minutes)

- [ ] User 1 clicks camera toggle → video turns off
- [ ] Other users see blank/avatar for User 1
- [ ] User 1 toggles camera back on → video returns
- [ ] User 2 clicks microphone toggle → mic mutes
- [ ] Other users don't hear User 2
- [ ] User 2 unmutes → audio returns

11. **Error Recovery** (3 minutes)

- [ ] User 3 temporarily loses connection (disable network)
- [ ] User 3 shows "Reconnecting..." status
- [ ] Re-enable network
- [ ] User 3 reconnects automatically
- [ ] Game state preserved (life totals correct)
- [ ] Video/audio resume

12. **Game Conclusion** (2 minutes)

- [ ] User 1 clicks "Game: ON" to toggle to "Game: OFF"
- [ ] Game state overlay closes
- [ ] Game duration displayed
- [ ] All users still in video room
- [ ] Can start new game or leave

13. **Cleanup** (1 minute)

- [ ] Each user clicks camera toggle to turn off
- [ ] Each user leaves room (close tab or navigate away)
- [ ] Room automatically cleaned up after all users leave

**Expected Results**:

- ✅ All features work seamlessly together
- ✅ No crashes or errors
- ✅ State syncs in real-time (<100ms)
- ✅ Video quality remains stable
- ✅ Card recognition accuracy >80%

**Performance Metrics**:

- Video latency: <500ms
- State sync latency: <100ms
- Card recognition time: 2-3 seconds
- Memory usage: <500 MB per client
- CPU usage: <50% on modern hardware

---

### Scenario 2: 2-Player Standard Game (Quick Test)

**Duration**: 10 minutes

**Steps**:

1. Join video room (2 players)
2. Start game (Standard format, 20 life)
3. Play 5 turns with life changes
4. Recognize 3 different cards
5. End game

**Verification**:

- Basic functionality works
- 2-player peer connection stable
- Standard life totals correct (20)

---

### Scenario 3: Mobile Device Testing

**Objective**: Verify mobile responsive design and touch interactions.

**Devices**:

- iPhone (Safari)
- Android (Chrome)

**Steps**:

1. Join room from mobile device
2. Verify video fits screen
3. Test touch controls for life counter
4. Test card recognition with tap
5. Verify layout adapts to portrait/landscape

**Expected**:

- Touch targets >44px
- No horizontal scrolling
- Video aspect ratio preserved
- All features accessible on mobile

---

### Scenario 4: Network Stress Test

**Objective**: Test behavior under poor network conditions.

**Steps**:

1. Start 4-player game
2. Simulate high latency (200-500ms)
3. Simulate packet loss (5-10%)
4. Simulate bandwidth throttling (1 Mbps)
5. Verify graceful degradation

**Expected**:

- Video quality adapts (lower resolution)
- Audio prioritized over video
- State sync continues
- No crashes or disconnects

---

### Scenario 5: Browser Compatibility

**Browsers to Test**:

- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

**Verification Matrix**:
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Video | ✓ | ✓ | ✓ | ✓ |
| Card ID | ✓ | ✓ | ✓ | ✓ |
| Game State | ✓ | ✓ | ✓ | ✓ |
| Media Controls | ✓ | ✓ | ✓ | ✓ |

---

### Scenario 6: Security Testing

**Objective**: Verify security and privacy measures.

**Tests**:

1. **Permission Handling**
   - Deny camera permission → Error message shown
   - Deny microphone permission → Error shown
   - Grant permissions → Features work

2. **Data Privacy**
   - Verify no video recording on server
   - Verify OCR runs client-side
   - Verify game state not persisted

3. **Authentication**
   - Verify room access with auth
   - Test unauthenticated access (should fail)

---

### Scenario 7: Load Testing

**Objective**: Test system under concurrent load.

**Setup**:

- 20 concurrent rooms
- 4 players per room
- Total: 80 concurrent users

**Metrics to Monitor**:

- Server CPU usage
- Server memory usage
- Socket.IO connection count
- Average state sync latency
- Video quality across all rooms

**Success Criteria**:

- Server CPU < 80%
- Server memory < 2GB
- Sync latency < 150ms
- No dropped connections

---

### Scenario 8: Accessibility Testing

**Objective**: Verify WCAG 2.1 AA compliance.

**Tests**:

1. **Keyboard Navigation**
   - Tab through all controls
   - Activate buttons with Enter/Space
   - Navigate modal with keyboard
   - Close modal with Escape

2. **Screen Reader**
   - Test with NVDA/JAWS
   - Verify ARIA labels
   - Verify form labels
   - Verify error messages

3. **Color Contrast**
   - Verify 4.5:1 contrast ratio
   - Test color-blind modes
   - Verify warning colors distinguishable

4. **Focus Management**
   - Verify visible focus indicators
   - Focus trapped in modals
   - Focus returns after modal close

---

## Automated Test Commands

```bash
# Run all unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests with Playwright
npm run test:e2e

# Generate coverage report
npm run test:coverage

# Run specific test suite
npm test -- features/video
npm test -- features/card-recognition
npm test -- features/game-state
```

---

## Test Data

### Sample Room IDs

- `mtg-standard-test-001`
- `mtg-commander-test-002`
- `pokemon-test-003`
- `yugioh-test-004`

### Sample User IDs

- `test-user-001`
- `test-user-002`
- `test-user-003`
- `test-user-004`

### Sample Cards (for recognition testing)

- Lightning Bolt
- Sol Ring
- Black Lotus
- Counterspell
- Swords to Plowshares
- Path to Exile

---

## Bug Reporting Template

```markdown
**Title**: [Feature] - Brief description

**Environment**:

- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
- Network: WiFi, 50 Mbps

**Steps to Reproduce**:

1. Join room with 4 players
2. Enable game state
3. Update life total
4. ...

**Expected Result**:
Life total should update for all players

**Actual Result**:
Life total only updates for current user

**Screenshots**:
[Attach screenshots]

**Console Errors**:
[Paste console errors]

**Additional Context**:
[Any other relevant information]
```

---

## Performance Benchmarks

### Baseline (Development)

- Initial load time: 2-3 seconds
- WebRTC connection: 2-5 seconds
- Card recognition: 2-3 seconds
- State sync: 50-100ms

### Target (Production)

- Initial load time: <2 seconds
- WebRTC connection: <3 seconds
- Card recognition: <2 seconds
- State sync: <100ms

---

## Test Completion Checklist

- [ ] All scenarios pass
- [ ] No critical bugs
- [ ] Performance metrics met
- [ ] Security tests pass
- [ ] Accessibility tests pass
- [ ] Browser compatibility verified
- [ ] Mobile testing complete
- [ ] Documentation updated
- [ ] User acceptance testing done

---

**Last Updated**: January 2025  
**Test Coverage**: 80%+  
**Status**: Ready for Production Testing ✅
